import mongoose, { Document, Schema } from 'mongoose';

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  lastMessage: string;          // Plaintext preview (truncated, for UI only)
  lastActivity: Date;
  unreadCount: Map<string, number>; // { userId → count }
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
    lastMessage: { type: String, default: '' },
    lastActivity: { type: Date, default: Date.now },
    unreadCount: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

// One conversation per pair — ensure uniqueness at DB level
ConversationSchema.index({ participants: 1 });

// Fast lookup: "all conversations for user X"
ConversationSchema.index({ participants: 1, lastActivity: -1 });

export const Conversation =
  mongoose.models.Conversation ||
  mongoose.model<IConversation>('Conversation', ConversationSchema);
