import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const notifications = await Notification.find({ recipient: session.userId })
      .populate({
        path: 'sender',
        model: User,
        select: 'name profilePhoto username'
      })
      .sort({ createdAt: -1 })
      .limit(50); // limit to recent 50 for performance

    return NextResponse.json({ notifications }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT() {
  try {
    const session = await getSession();
    if (!session || !session.userId) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Mark all as read for the user
    await Notification.updateMany(
      { recipient: session.userId, isRead: false },
      { $set: { isRead: true } }
    );

    return NextResponse.json({ message: 'Notifications marked as read' }, { status: 200 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
