import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  recipient: mongoose.Types.ObjectId;
  sender: mongoose.Types.ObjectId;
  type: 'like' | 'comment' | 'follow' | 'mention';
  blogId?: mongoose.Types.ObjectId;
  message?: string;
  isRead: boolean;
  createdAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['like', 'comment', 'follow', 'mention'], required: true },
  blogId: { type: Schema.Types.ObjectId, ref: 'Blog' },
  message: { type: String },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

// Drop the model if it exists to prevent overwrite errors in Next.js development
if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Notification;
}

export const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);
