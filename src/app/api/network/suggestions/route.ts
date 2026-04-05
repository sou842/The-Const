import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Connection } from '@/models/Connection';
import { User } from '@/models/User';
import { getSessionFromRequest } from '@/lib/auth';
import mongoose from 'mongoose';
import { getCache, setCache } from '@/lib/memoryCache';

// ─── GET /api/network/suggestions?page=1&limit=20 ────────────────────────────
// "People you may know" — all users excluding self, existing connections, and pending parties.
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = (page - 1) * limit;

    const cacheKey = `suggestions:${session.userId}:${page}:${limit}`;
    const cached = getCache<{ suggestions: unknown[]; total: number; page: number; totalPages: number }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    await connectDB();
    const userId = new mongoose.Types.ObjectId(session.userId);

    // Collect all user IDs that already have ANY connection relationship with me
    const existingConnections = await Connection.find({
      $or: [{ requesterId: userId }, { receiverId: userId }],
    })
      .select('requesterId receiverId')
      .lean();

    const excludedIds = new Set<string>([session.userId]);
    for (const c of existingConnections) {
      excludedIds.add(c.requesterId.toString());
      excludedIds.add(c.receiverId.toString());
    }

    const excludedObjectIds = Array.from(excludedIds).map(
      (id) => new mongoose.Types.ObjectId(id)
    );

    const [suggestions, total] = await Promise.all([
      User.find({ _id: { $nin: excludedObjectIds }, status: 'active' })
        .select('_id name profilePhoto profession shortBio location')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments({ _id: { $nin: excludedObjectIds }, status: 'active' }),
    ]);

    const response = { suggestions, total, page, totalPages: Math.ceil(total / limit) };
    setCache(cacheKey, response, 60000);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Network suggestions error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
