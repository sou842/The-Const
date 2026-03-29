import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Connection } from '@/models/Connection';
import { getSessionFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';

// ─── GET /api/network/connections?page=1&limit=20 ────────────────────────────
// List all accepted connections for the logged-in user.
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.userId);

    // Match accepted connections where this user is either party
    const matchStage = {
      status: 'accepted',
      $or: [{ requesterId: userId }, { receiverId: userId }],
    };

    const [connections, total] = await Promise.all([
      Connection.aggregate([
        { $match: matchStage },
        { $sort: { updatedAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Determine which field is "the other person"
        {
          $addFields: {
            otherUserId: {
              $cond: [{ $eq: ['$requesterId', userId] }, '$receiverId', '$requesterId'],
            },
          },
        },
        {
          $lookup: {
            from: 'users',
            localField: 'otherUserId',
            foreignField: '_id',
            as: 'user',
          },
        },
        { $unwind: '$user' },
        {
          $project: {
            _id: 1,
            createdAt: 1,
            updatedAt: 1,
            'user._id': 1,
            'user.name': 1,
            'user.profilePhoto': 1,
            'user.profession': 1,
            'user.shortBio': 1,
            'user.location': 1,
          },
        },
      ]),
      Connection.countDocuments(matchStage),
    ]);

    return NextResponse.json({ connections, total, page, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error('Network connections error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
