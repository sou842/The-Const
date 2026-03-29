import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Message } from '@/models/Message';
import { Conversation } from '@/models/Conversation';
import { getSessionFromRequest } from '@/lib/auth';
import { decryptMessage } from '@/lib/crypto';
import mongoose from 'mongoose';

// ─── GET /api/messages/[conversationId] ──────────────────────────────────────
// Load paginated message history. Messages are decrypted server-side before
// being sent to the client over HTTPS (TLS in transit).
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { conversationId } = await params;
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Verify participant
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }
    const userId = new mongoose.Types.ObjectId(session.userId);
    const isParticipant = conversation.participants.some(
      (p: mongoose.Types.ObjectId) => p.equals(userId)
    );
    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Decrypt each message before returning to client
    const decryptedMessages = messages
      .map((msg) => {
        try {
          const plaintext = decryptMessage({
            ciphertext: msg.content,
            iv: msg.iv,
            authTag: msg.authTag,
          });
          return {
            _id: msg._id,
            conversationId: msg.conversationId,
            senderId: msg.senderId,
            content: plaintext,
            readAt: msg.readAt,
            deliveredAt: msg.deliveredAt,
            createdAt: msg.createdAt,
          };
        } catch {
          // If decryption fails (tampered/corrupted), skip the message safely
          return null;
        }
      })
      .filter(Boolean)
      .reverse(); // reverse to get chronological order (oldest first)

    const total = await Message.countDocuments({ conversationId });

    // Mark all messages from the other user as delivered
    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        deliveredAt: null,
      },
      { $set: { deliveredAt: new Date() } }
    );

    return NextResponse.json({ messages: decryptedMessages, total, page });
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
