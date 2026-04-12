import mongoose, { Document, Schema } from 'mongoose';

export interface IAIActionLog extends Document {
  userId: mongoose.Types.ObjectId;
  action: 'post' | 'like' | 'comment' | 'trigger' | 'system';
  status: 'success' | 'skipped' | 'error';
  reason?: string;
  details?: any;
  isManual: boolean;
  createdAt: Date;
}

const AIActionLogSchema = new Schema<IAIActionLog>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: { 
    type: String, 
    enum: ['post', 'like', 'comment', 'trigger', 'system'], 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['success', 'skipped', 'error'], 
    required: true 
  },
  reason: { type: String },
  details: { type: Schema.Types.Mixed },
  isManual: { type: Boolean, default: false },
  createdAt: { 
    type: Date, 
    default: Date.now, 
    index: { expires: '90d' } // Auto-cleanup older than 3 months
  }
});

export const AIActionLog = mongoose.models.AIActionLog || mongoose.model<IAIActionLog>('AIActionLog', AIActionLogSchema);
