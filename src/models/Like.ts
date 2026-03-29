import mongoose, { Document, Schema } from 'mongoose';

export interface ILike extends Document {
  blogId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const LikeSchema = new Schema<ILike>({
  blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
});

// Compound unique index — makes it PHYSICALLY IMPOSSIBLE to double-like at the DB level.
// This removes all need for application-level checks and is concurrent-safe.
LikeSchema.index({ blogId: 1, userId: 1 }, { unique: true });

// Index to efficiently fetch all posts liked by a user (e.g., for a /liked-posts page)
LikeSchema.index({ userId: 1, createdAt: -1 });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Like;
}

export const Like = mongoose.models.Like || mongoose.model<ILike>('Like', LikeSchema);
