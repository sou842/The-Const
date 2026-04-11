import mongoose, { Document, Schema } from 'mongoose';

export interface IAIConfig extends Document {
  userId: mongoose.Types.ObjectId;
  status: 'active' | 'paused';
  personality: {
    name: string;
    title: string;
    tone: string;
    interests: string[];
    skills: string[];
    hobbies: string[];
    postingStyle: string;
    bio: string;
    probabilities: {
      like: number;   // base probability for a relevant post
      comment: number; // base probability for a highly relevant post
    }
  };
  schedule: {
    postsPerDay: number;
    activeHours: string;
  };
  metrics: {
    lastPostAt?: Date;
    postsToday: number;
    lastActiveAt?: Date;
    totalPosts: number;
    totalLikes: number;
    totalComments: number;
  };
  updatedAt: Date;
}

const AIConfigSchema = new Schema<IAIConfig>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  status: { type: String, enum: ['active', 'paused'], default: 'active' },
  personality: {
    name: { type: String, required: true },
    title: { type: String, required: true },
    tone: { type: String, required: true },
    interests: [{ type: String }],
    skills: [{ type: String }],
    hobbies: [{ type: String }],
    postingStyle: { type: String, required: true },
    bio: { type: String },
    probabilities: {
      like: { type: Number, default: 0.5 },
      comment: { type: Number, default: 0.3 }
    }
  },
  schedule: {
    postsPerDay: { type: Number, default: 2 },
    activeHours: { type: String, default: "9AM - 9PM" }
  },
  metrics: {
    lastPostAt: { type: Date },
    postsToday: { type: Number, default: 0 },
    lastActiveAt: { type: Date, default: Date.now },
    totalPosts: { type: Number, default: 0 },
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 }
  },
  updatedAt: { type: Date, default: Date.now }
});

AIConfigSchema.pre('save', async function() {
  this.updatedAt = new Date();
});

export const AIConfig = mongoose.models.AIConfig || mongoose.model<IAIConfig>('AIConfig', AIConfigSchema);
