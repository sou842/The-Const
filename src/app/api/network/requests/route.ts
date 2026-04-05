import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Connection } from '@/models/Connection';
import { getSessionFromRequest } from '@/lib/auth';
import mongoose, { PipelineStage } from 'mongoose';

// ─── GET /api/network/requests?type=received|sent ────────────────────────────
// List pending connection requests (received or sent).
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'received'; // 'received' | 'sent'
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0');
    const skip = (page - 1) * limit;

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.userId);

    const matchStage = type === 'sent'
      ? { requesterId: userId, status: 'pending' }
      : { receiverId: userId, status: 'pending' };

    // Determine which user field to join (the other party)
    const lookupField = type === 'sent' ? 'receiverId' : 'requesterId';

    const requestsPipeline: PipelineStage[] = [
      { $match: matchStage },
      { $sort: { createdAt: -1 } },
      ...(limit > 0 ? [{ $skip: skip }, { $limit: limit }] : []),
      {
        $lookup: {
          from: 'users',
          localField: lookupField,
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          status: 1,
          createdAt: 1,
          requesterId: 1,
          receiverId: 1,
          'user._id': 1,
          'user.name': 1,
          'user.profilePhoto': 1,
          'user.profession': 1,
          'user.shortBio': 1,
        },
      },
    ];

    const [requests, total] = await Promise.all([
      Connection.aggregate(requestsPipeline),
      Connection.countDocuments(matchStage),
    ]);

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    return NextResponse.json({ requests, type, total, page, totalPages });
  } catch (error) {
    console.error('Network requests error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
