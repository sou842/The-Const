import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { Like } from '@/models/Like';
import { Notification } from '@/models/Notification';
import { getSession } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';
import mongoose from 'mongoose';

// POST /api/blogs/[url]/like
// Atomically toggles a like for the authenticated user.
// The Like model's compound unique index on (blogId, userId) guarantees
// that double-likes are impossible even under concurrent requests.
export async function POST(_req: Request, { params }: { params: Promise<{ url: string }> }) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await params;
    if (!url || !mongoose.Types.ObjectId.isValid(url)) {
      return NextResponse.json({ message: 'Invalid blog ID' }, { status: 400 });
    }

    await connectDB();

    const blogId = new mongoose.Types.ObjectId(url);
    const userId = new mongoose.Types.ObjectId(session.userId);

    // Check if the like already exists
    const existingLike = await Like.findOne({ blogId, userId });

    let isLiked: boolean;

    if (existingLike) {
      // Unlike: atomically remove the Like document
      await Like.deleteOne({ _id: existingLike._id });
      isLiked = false;
    } else {
      // Like: create a new Like document. The unique index will reject duplicates.
      try {
        await Like.create({ blogId, userId });
        isLiked = true;
      } catch (err: unknown) {
        // Handle duplicate key error (code 11000) gracefully
        if (err instanceof Error && 'code' in err && (err as NodeJS.ErrnoException).code === '11000') {
          // Already liked (race condition) — treat as success
          isLiked = true;
        } else {
          throw err;
        }
      }

      // Send notification to blog author (only on like, not unlike)
      const blog = await Blog.findById(blogId).select('authorId title').lean();
      if (blog && blog.authorId.toString() !== session.userId) {
        const notif = await Notification.create({
          recipient: blog.authorId,
          sender: userId,
          type: 'like',
          blogId,
        });

        // Real-time live push via Pusher
        await pusherServer.trigger(
          `user_${blog.authorId.toString()}`,
          "notification:new",
          notif
        );
      }
    }

    // Return the fresh, accurate like count from the Like collection
    const likeCount = await Like.countDocuments({ blogId });

    return NextResponse.json({ isLiked, likeCount }, { status: 200 });
  } catch (error) {
    console.error('Error toggling like:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// GET /api/blogs/[url]/like
// Returns the like count and whether the authenticated user has liked this blog.
export async function GET(_req: Request, { params }: { params: Promise<{ url: string }> }) {
  try {
    const { url } = await params;
    if (!url || !mongoose.Types.ObjectId.isValid(url)) {
      return NextResponse.json({ message: 'Invalid blog ID' }, { status: 400 });
    }

    await connectDB();

    const blogId = new mongoose.Types.ObjectId(url);
    const session = await getSession();

    const [likeCount, existingLike] = await Promise.all([
      Like.countDocuments({ blogId }),
      session?.userId
        ? Like.findOne({ blogId, userId: new mongoose.Types.ObjectId(session.userId) }).lean()
        : null,
    ]);

    return NextResponse.json({
      likeCount,
      isLiked: !!existingLike,
    });
  } catch (error) {
    console.error('Error fetching like status:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
