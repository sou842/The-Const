import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Connection } from '@/models/Connection';
import { getSessionFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// ─── GET /api/network/status?targetUserId=xxx ─────────────────────────────────
// Returns the connection relationship between the logged-in user and a target.
// This is the core endpoint consumed by useConnection hook.
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('targetUserId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'targetUserId query param is required' }, { status: 400 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.userId);
    const targetId = new mongoose.Types.ObjectId(targetUserId);

    const connection = await Connection.findOne({
      $or: [
        { requesterId: userId, receiverId: targetId },
        { requesterId: targetId, receiverId: userId },
      ],
    }).lean();

    if (!connection) {
      return NextResponse.json({ status: 'none', connectionId: null });
    }

    const isSender = connection.requesterId.toString() === session.userId;

    let status: 'pending_sent' | 'pending_received' | 'connected' | 'declined';
    if (connection.status === 'accepted') {
      status = 'connected';
    } else if (connection.status === 'declined') {
      status = 'declined';
    } else {
      status = isSender ? 'pending_sent' : 'pending_received';
    }

    return NextResponse.json({ status, connectionId: connection._id });
  } catch (error) {
    console.error('Network status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
