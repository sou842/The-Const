import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Conversation } from '@/models/Conversation';
import { Connection } from '@/models/Connection';
import { getSessionFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// ─── GET /api/messages/conversations ─────────────────────────────────────────
// Returns all conversations for the logged-in user, with the other
// participant's profile data joined via aggregation.
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.userId);

    const conversations = await Conversation.aggregate([
      { $match: { participants: userId } },
      { $sort: { lastActivity: -1 } },
      // Join other participant's profile
      {
        $lookup: {
          from: 'users',
          let: { parts: '$participants' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $in: ['$_id', '$$parts'] },
                    { $ne: ['$_id', userId] },
                  ],
                },
              },
            },
            { $project: { name: 1, profilePhoto: 1, profession: 1 } },
          ],
          as: 'otherUser',
        },
      },
      { $unwind: { path: '$otherUser', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          lastMessage: 1,
          lastActivity: 1,
          otherUser: 1,
          unreadCount: { $ifNull: [{ $getField: { field: session.userId, input: '$unreadCount' } }, 0] },
        },
      },
    ]);

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Conversations GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── POST /api/messages/conversations ────────────────────────────────────────
// Start or retrieve a conversation with a connected user. Idempotent.
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }
    if (targetUserId === session.userId) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 });
    }

    const userId = new mongoose.Types.ObjectId(session.userId);
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    // Guard: only allow messaging between accepted connections
    const isConnected = await Connection.findOne({
      status: 'accepted',
      $or: [
        { requesterId: userId, receiverId: targetId },
        { requesterId: targetId, receiverId: userId },
      ],
    });
    if (!isConnected) {
      return NextResponse.json(
        { error: 'You can only message your connections' },
        { status: 403 }
      );
    }

    // Find existing or create new conversation (idempotent)
    let conversation = await Conversation.findOne({
      participants: { $all: [userId, targetId], $size: 2 },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [userId, targetId],
        lastMessage: '',
        lastActivity: new Date(),
        unreadCount: {},
      });
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Conversations POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
