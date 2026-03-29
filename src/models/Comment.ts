import mongoose, { Document, Schema } from 'mongoose';

export interface IComment extends Document {
  blogId: mongoose.Types.ObjectId;
  authorId: mongoose.Types.ObjectId;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const CommentSchema = new Schema<IComment>({
  blogId: { type: Schema.Types.ObjectId, ref: 'Blog', required: true, index: true },
  authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true, maxlength: 500 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Compound index: fetch all comments for a blog sorted by time — O(log n)
CommentSchema.index({ blogId: 1, createdAt: 1 });

// Update the updatedAt field before saving
CommentSchema.pre('validate', function() {
    this.updatedAt = new Date();
});

if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Comment;
}

export const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);
