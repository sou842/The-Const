import mongoose, { Document, Schema } from 'mongoose';

export interface IMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  content: string;    // AES-256-GCM ciphertext (hex)
  iv: string;         // Initialization vector (hex) — unique per message
  authTag: string;    // GCM authentication tag (hex) — guarantees integrity
  readAt: Date | null;
  deliveredAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
    senderId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    readAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Critical index: load conversation history newest-first with pagination
MessageSchema.index({ conversationId: 1, createdAt: -1 });

// Fast lookup for unread messages per conversation per user
MessageSchema.index({ conversationId: 1, readAt: 1 });

export const Message =
  mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema);
