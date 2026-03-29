import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { User } from '@/models/User';
import { Blog } from '@/models/Blog';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.userId).populate({
      path: 'savedBlogs',
      model: Blog,
      populate: {
        path: 'authorId',
        select: 'name profilePhoto username'
      }
    });

    if (!user) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ savedBlogs: user.savedBlogs }, { status: 200 });
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
