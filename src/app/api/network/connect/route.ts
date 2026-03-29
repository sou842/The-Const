import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Connection } from '@/models/Connection';
import { getSessionFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// ─── POST /api/network/connect ────────────────────────────────────────────────
// Send a connection request to another user.
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { targetUserId } = await req.json();

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId is required' }, { status: 400 });
    }

    // Guard: cannot connect with yourself
    if (session.userId === targetUserId) {
      return NextResponse.json({ error: 'You cannot connect with yourself' }, { status: 400 });
    }

    const requesterId = new mongoose.Types.ObjectId(session.userId);
    const receiverId = new mongoose.Types.ObjectId(targetUserId);

    // Guard: prevent duplicate in either direction
    const existing = await Connection.findOne({
      $or: [
        { requesterId, receiverId },
        { requesterId: receiverId, receiverId: requesterId },
      ],
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'You are already connected' }, { status: 409 });
      }
      if (existing.status === 'pending') {
        return NextResponse.json({ error: 'A connection request already exists' }, { status: 409 });
      }
      // If previously declined, allow re-requesting by updating
      existing.status = 'pending';
      existing.requesterId = requesterId;
      existing.receiverId = receiverId;
      await existing.save();
      return NextResponse.json({ connection: existing }, { status: 200 });
    }

    const connection = await Connection.create({ requesterId, receiverId, status: 'pending' });
    return NextResponse.json({ connection }, { status: 201 });
  } catch (error) {
    console.error('Network connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── PUT /api/network/connect ─────────────────────────────────────────────────
// Accept or decline a received connection request.
export async function PUT(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { connectionId, action } = await req.json();

    if (!connectionId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'connectionId and action (accept|decline) are required' }, { status: 400 });
    }

    const connection = await Connection.findById(connectionId);
    if (!connection) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });

    // Guard: only the RECEIVER can accept or decline
    if (connection.receiverId.toString() !== session.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (connection.status !== 'pending') {
      return NextResponse.json({ error: 'This request has already been actioned' }, { status: 409 });
    }

    connection.status = action === 'accept' ? 'accepted' : 'declined';
    await connection.save();

    return NextResponse.json({ connection });
  } catch (error) {
    console.error('Network action error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ─── DELETE /api/network/connect ─────────────────────────────────────────────
// Withdraw a sent request OR remove an existing connection.
export async function DELETE(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    await connectDB();
    const { connectionId, targetUserId } = await req.json();

    let connection;

    if (connectionId) {
      connection = await Connection.findById(connectionId);
    } else if (targetUserId) {
      const userId = new mongoose.Types.ObjectId(session.userId);
      const targetId = new mongoose.Types.ObjectId(targetUserId);
      connection = await Connection.findOne({
        $or: [
          { requesterId: userId, receiverId: targetId },
          { requesterId: targetId, receiverId: userId },
        ],
      });
    }

    if (!connection) return NextResponse.json({ error: 'Connection not found' }, { status: 404 });

    // Guard: only a party of the connection can remove it
    const userId = session.userId;
    const isParty =
      connection.requesterId.toString() === userId ||
      connection.receiverId.toString() === userId;

    if (!isParty) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    await connection.deleteOne();
    return NextResponse.json({ message: 'Connection removed successfully' });
  } catch (error) {
    console.error('Network delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
