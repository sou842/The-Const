/**
 * POST /api/messages/[conversationId]/read
 *
 * Marks all unread messages in a conversation as read for the calling user,
 * then triggers a Pusher `message-read-ack` event so the sender's UI
 * can update its read-receipt indicators in real-time.
 */

import { NextRequest, NextResponse } from "next/server";
import Pusher from "pusher";
import connectDB from "@/lib/db";
import { Message } from "@/models/Message";
import { Conversation } from "@/models/Conversation";
import { getSessionFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const { conversationId } = await params;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return NextResponse.json({ error: "Invalid conversationId" }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.userId);

    // Mark all messages NOT sent by this user as read
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        readAt: null,
      },
      { $set: { readAt: new Date() } }
    );

    // Reset this user's unread count
    const conv = await Conversation.findById(conversationId);
    if (conv) {
      (conv.unreadCount as Map<string, number>).set(session.userId, 0);
      conv.markModified("unreadCount");
      await conv.save();
    }

    // Notify the sender(s) via Pusher that their messages were read
    await pusherServer.trigger(
      `chat-${conversationId}`,
      "message-read-ack",
      { readBy: session.userId, readAt: new Date().toISOString() }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[read] Error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
