import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { getSession } from '@/lib/auth';

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId).select("savedBlogs").lean();

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '0');
    const skip = (page - 1) * limit;

    const savedIds = user.savedBlogs || [];
    const total = savedIds.length;
    const slicedIds = limit > 0 ? savedIds.slice(skip, skip + limit) : savedIds;

    const blogs = await Blog.find({ _id: { $in: slicedIds } })
      .select("title author authorId thumbnail image category tags url createdAt publishedDate status views contentType")
      .populate({
        path: 'authorId',
        select: 'name profilePhoto username'
      })
      .lean();

    const blogMap = new Map(blogs.map((b) => [b._id.toString(), b]));
    const orderedBlogs = slicedIds
      .map((id: any) => blogMap.get(id.toString()))
      .filter(Boolean);

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    return NextResponse.json({ savedBlogs: orderedBlogs, total, page, totalPages }, { status: 200 });
  } catch (error) {
    console.error('Error fetching saved blogs:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { blogId } = await req.json();
    if (!blogId) {
      return NextResponse.json({ message: 'Blog ID is required' }, { status: 400 });
    }

    await connectDB();

    // Add blogId to savedBlogs if it doesn't already exist
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    if (!user.savedBlogs.includes(blogId)) {
        user.savedBlogs.push(blogId);
        await user.save();
    }

    return NextResponse.json({ message: 'Blog saved successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error saving blog:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const { blogId } = await req.json();
    if (!blogId) {
      return NextResponse.json({ message: 'Blog ID is required' }, { status: 400 });
    }

    await connectDB();

    // Remove blogId from savedBlogs
    await User.findByIdAndUpdate(session.userId, {
      $pull: { savedBlogs: blogId }
    });

    return NextResponse.json({ message: 'Blog removed from saved' }, { status: 200 });
  } catch (error) {
    console.error('Error removing saved blog:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
