import mongoose, { Document, Schema } from 'mongoose';

// ========= User Schema =========
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'creator';
  access: {
    canApprove: boolean;
    canAddBlog: boolean;
  };
  createdAt: Date;
  status: 'active' | 'inactive';
  savedBlogs: mongoose.Types.ObjectId[];

  oauthProvider?: 'google' | 'github' | null;
  oauthId?: string;
  emailVerified?: boolean;
 
  username?: string;
  profilePhoto?: string;
  bannerPhoto?: string;
  shortBio?: string;
  location?: string;
  profession?: string;
  expertise?: string[];
  yearsOfExperience?: number;
  longBio?: string;
  socialLinks?: {
    twitter?: string;
    linkedin?: string;
    website?: string;
    instagram?: string;
    youtube?: string;
    github?: string;
  };
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: false },
  role: { type: String, enum: ['admin', 'creator'], default: 'creator' },
  access: {
    canApprove: { type: Boolean, default: false },
    canAddBlog: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  savedBlogs: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],

  // OAuth fields  
  oauthProvider: { type: String, enum: ['google', 'github', null], default: null },
  oauthId: { type: String },
  emailVerified: { type: Boolean, default: false },

  username: { type: String, unique: true, sparse: true },
  profilePhoto: { type: String },
  bannerPhoto: { type: String },
  shortBio: { type: String, maxlength: 150 },
  location: { type: String },
  profession: { type: String },
  expertise: [{ type: String }],
  yearsOfExperience: { type: Number },
  longBio: { type: String, maxlength: 1000 },
  socialLinks: {
    twitter: { type: String },
    linkedin: { type: String },
    website: { type: String },
    instagram: { type: String },
    youtube: { type: String },
    github: { type: String },
  }
});

// Suggestions and admin/user lists commonly filter by status and sort by createdAt
UserSchema.index({ status: 1, createdAt: -1 });

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
