/**
 * POST /api/send-message
 *
 * Accepts a new chat message, persists it to MongoDB (encrypt → save),
 * then triggers a Pusher event so all subscribers receive it in real-time.
 *
 * Body: { message: string, senderId: string, receiverId: string, roomId: string }
 */

import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";
import connectDB from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { encryptMessage, sanitizeMessage } from "@/lib/crypto";
import mongoose from "mongoose";

// ── Pusher server-side singleton ──────────────────────────────────────────────
// Initialised once per serverless function warm-start.
// Uses server-only (non-NEXT_PUBLIC_) env vars — never exposed to the browser.
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true, // Always use encrypted connection to Pusher's API
});

export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate the caller via session cookie ─────────────────────
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // ── 2. Parse and validate the request body ────────────────────────────
    const body = await request.json();
    const { message, roomId } = body as {
      message?: string;
      senderId?: string;
      receiverId?: string;
      roomId?: string;
    };

    if (!message?.trim() || !roomId) {
      return NextResponse.json(
        { error: "message and roomId are required" },
        { status: 400 }
      );
    }

    // ── 3. Connect to MongoDB and retrieve the conversation ───────────────
    await connectDB();

    const { Conversation } = await import("@/models/Conversation");
    const { Message } = await import("@/models/Message");

    // Validate that roomId is a valid conversation the user participates in
    if (!mongoose.Types.ObjectId.isValid(roomId)) {
      return NextResponse.json({ error: "Invalid roomId" }, { status: 400 });
    }

    const conversation = await Conversation.findById(roomId);
    if (!conversation) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const senderId = new mongoose.Types.ObjectId(session.userId);
    const isParticipant = conversation.participants.some(
      (p: mongoose.Types.ObjectId) => p.equals(senderId)
    );
    if (!isParticipant) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── 4. Sanitize → Encrypt → Persist ──────────────────────────────────
    const sanitized = sanitizeMessage(message);
    if (!sanitized) {
      return NextResponse.json({ error: "Empty message" }, { status: 400 });
    }

    const { ciphertext, iv, authTag } = encryptMessage(sanitized);
    const saved = await Message.create({
      conversationId: roomId,
      senderId,
      content: ciphertext,
      iv,
      authTag,
      deliveredAt: null,
      readAt: null,
    });

    // Update conversation last-message preview and unread counts
    const otherParticipant = conversation.participants.find(
      (p: mongoose.Types.ObjectId) => !p.equals(senderId)
    );
    const unreadKey = otherParticipant?.toString();
    const currentUnread =
      (conversation.unreadCount as Map<string, number>).get(unreadKey) || 0;
    conversation.lastMessage =
      sanitized.length > 80 ? sanitized.slice(0, 80) + "…" : sanitized;
    conversation.lastActivity = new Date();
    (conversation.unreadCount as Map<string, number>).set(
      unreadKey,
      currentUnread + 1
    );
    conversation.markModified("unreadCount");
    await conversation.save();

    // ── 5. Build the plaintext payload for real-time delivery ─────────────
    // TLS protects the data in transit; we do NOT send ciphertext here.
    const outgoingMessage = {
      _id: saved._id.toString(),
      conversationId: roomId,
      senderId: session.userId,
      senderName: session.name,
      content: sanitized, // plaintext — TLS handles encryption in transit
      readAt: null,
      deliveredAt: null,
      createdAt: saved.createdAt,
    };

    // ── 6. Trigger the Pusher event ───────────────────────────────────────
    // Channel name: `chat-${roomId}` — one channel per conversation room
    // Event name: `new-message` — the client hook listens for exactly this
    await pusherServer.trigger(
      `chat-${roomId}`,   // Channel
      "new-message",       // Event
      outgoingMessage      // Payload
    );

    return NextResponse.json({ success: true, messageId: saved._id.toString() });
  } catch (err) {
    console.error("[send-message] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
