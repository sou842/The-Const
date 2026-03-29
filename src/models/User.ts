import mongoose, { Document, Schema } from 'mongoose';

// ========= User Schema =========
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'creator';
  access: {
    canApprove: boolean;
    canAddBlog: boolean;
  };
  createdAt: Date;
  status: 'active' | 'inactive';
  savedBlogs: mongoose.Types.ObjectId[];
  
  // Public Creator Profile Fields (Optional)
  username?: string; // e.g., 'johndoe'
  profilePhoto?: string;
  bannerPhoto?: string;
  shortBio?: string;
  location?: string;
  profession?: string;
  expertise?: string[]; // Areas of Expertise / Topics
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
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'creator'], default: 'creator' },
  access: {
    canApprove: { type: Boolean, default: false },
    canAddBlog: { type: Boolean, default: true },
  },
  createdAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  savedBlogs: [{ type: Schema.Types.ObjectId, ref: 'Blog' }],

  // Public Creator Profile Fields
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

export const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
