import mongoose, { Document, Schema } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

export interface IBlog extends Document {
    title: string;
    body: Record<string, unknown>;
    thumbnail: {
        title?: string;
        description?: string;
        image?: string;
    };
    category: string;
    tags: string[];
    author: string;
    authorId: mongoose.Types.ObjectId;
    publishedDate: Date;
    status: 'approved' | 'pending' | 'rejected';
    editorType: string;
    views: number;
    videoUrl?: string;
    language: 'en' | 'hi';
    url: string;
    createdAt: Date;
    updatedAt: Date;
    isTrending: boolean;
}

const BlogSchema = new Schema<IBlog>({
    title: { type: String, required: true },
    body: { type: Schema.Types.Mixed, required: true },
    thumbnail: { type: Schema.Types.Mixed, required: true },
    category: { type: String, required: true },
    tags: [{ type: String }],
    author: { type: String, required: true },
    authorId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    publishedDate: { type: Date },
    status: { type: String, enum: ['approved', 'pending', 'rejected'], default: 'pending' },
    editorType: { type: String },
    views: { type: Number, default: 0 },
    videoUrl: { type: String },
    language: { type: String, enum: ['en', 'hi'], default: 'en' },
    url: { type: String },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    isTrending: { type: Boolean, default: false },
});

BlogSchema.pre('validate', async function() {
    this.updatedAt = new Date();

    if (!this.url) {
        const title = this.title || "untitled";
        const slug = title
            .trim()
            .replace(/\?|\!|\.|\,|\'|\"/g, "")
            .replace(/&/g, "and")
            .replace(/[^\w\s-]/g, "")
            .replace(/\s+/g, "-")
            .toLowerCase();

        const suffix = uuidv4().split("-")[0];
        this.url = `${slug}-${suffix}`;
    }
});

if (process.env.NODE_ENV === 'development') {
    delete mongoose.models.Blog;
}

export const Blog = mongoose.models.Blog || mongoose.model<IBlog>('Blog', BlogSchema);
