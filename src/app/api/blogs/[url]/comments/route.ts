import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Blog } from '@/models/Blog';
import { Comment } from '@/models/Comment';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { getSession } from '@/lib/auth';
import { pusherServer } from '@/lib/pusher';
import mongoose from 'mongoose';

// GET /api/blogs/[url]/comments?page=1&limit=20
// Returns paginated comments for a blog, sorted oldest-first (shows conversation flow).
export async function GET(req: Request, { params }: { params: Promise<{ url: string }> }) {
  try {
    const { url } = await params;
    if (!url || !mongoose.Types.ObjectId.isValid(url)) {
      return NextResponse.json({ message: 'Invalid blog ID' }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    await connectDB();

    const blogId = new mongoose.Types.ObjectId(url);

    const [comments, totalCount] = await Promise.all([
      Comment.find({ blogId })
        .populate({
          path: 'authorId',
          model: User,
          select: 'name profilePhoto username',
        })
        .sort({ createdAt: 1 }) // Oldest first — shows conversation flow (Reddit/Twitter style)
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ blogId }),
    ]);

    return NextResponse.json({
      comments,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: skip + comments.length < totalCount,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/blogs/[url]/comments
// Creates a new comment and notifies the blog author.
export async function POST(req: Request, { params }: { params: Promise<{ url: string }> }) {
  try {
    const session = await getSession();
    if (!session?.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { url } = await params;
    if (!url || !mongoose.Types.ObjectId.isValid(url)) {
      return NextResponse.json({ message: 'Invalid blog ID' }, { status: 400 });
    }

    const body = await req.json();
    const content = typeof body?.content === 'string' ? body.content.trim() : '';

    if (!content) {
      return NextResponse.json({ message: 'Comment content is required' }, { status: 400 });
    }
    if (content.length > 500) {
      return NextResponse.json({ message: 'Comment must be 500 characters or fewer' }, { status: 422 });
    }

    await connectDB();

    const blogId = new mongoose.Types.ObjectId(url);
    const authorId = new mongoose.Types.ObjectId(session.userId);

    // Verify blog exists
    const blog = await Blog.findById(blogId).select('authorId title').lean();
    if (!blog) {
      return NextResponse.json({ message: 'Blog not found' }, { status: 404 });
    }

    // Create and populate the comment in one round-trip
    const newComment = await Comment.create({ blogId, authorId, content });
    const populatedComment = await Comment.findById(newComment._id)
      .populate({ path: 'authorId', model: User, select: 'name profilePhoto username' })
      .lean();

    // Send notification to blog author (skip if commenting on own post)
    if (blog.authorId.toString() !== session.userId) {
      const notif = await Notification.create({
        recipient: blog.authorId,
        sender: authorId,
        type: 'comment',
        blogId,
      });

      // Real-time live push via Pusher
      await pusherServer.trigger(
        `user_${blog.authorId.toString()}`,
        "notification:new",
        notif
      );
    }

    // Return the accurate comment count directly from the collection
    const commentCount = await Comment.countDocuments({ blogId });

    return NextResponse.json({ comment: populatedComment, commentCount }, { status: 201 });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
