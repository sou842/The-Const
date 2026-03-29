import mongoose, { Document, Schema } from 'mongoose';

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface IConnection extends Document {
  requesterId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  status: ConnectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

const ConnectionSchema = new Schema<IConnection>(
  {
    requesterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    receiverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

// DB-level unique guard: prevent duplicate connection pairs
ConnectionSchema.index({ requesterId: 1, receiverId: 1 }, { unique: true });

// Fast queries for "pending requests I received"
ConnectionSchema.index({ receiverId: 1, status: 1 });
// Fast queries for "requests I sent"
ConnectionSchema.index({ requesterId: 1, status: 1 });

if (process.env.NODE_ENV === 'development') {
  delete mongoose.models.Connection;
}

export const Connection =
  mongoose.models.Connection ||
  mongoose.model<IConnection>('Connection', ConnectionSchema);
