/**
 * POST /api/messages/typing
 *
 * Receives a typing status update from a client and triggers a Pusher event
 * on the conversation channel so the other participant sees the typing indicator.
 *
 * Body: { conversationId: string, isTyping: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";
import { getSessionFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

// Re-use the same Pusher server instance pattern as /api/send-message
const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: NextRequest) {
  try {
    const session = await getSessionFromRequest(request);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { conversationId, isTyping } = (await request.json()) as {
      conversationId?: string;
      isTyping?: boolean;
    };

    if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });
    }

    // Trigger typing-update event so other participants see the indicator
    await pusherServer.trigger(
      `chat-${conversationId}`,  // Same channel as messages
      "typing-update",            // Event the client hook binds to
      { userId: session.userId, isTyping: Boolean(isTyping) }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[typing] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
