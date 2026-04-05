import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Like } from "@/models/Like";
import { Comment } from "@/models/Comment";
import { getSessionFromRequest } from "@/lib/auth";
import mongoose from "mongoose";

// Ensure models are registered
void Like;
void Comment;

export async function GET(req: NextRequest, { params }: { params: Promise<{ url: string }> }) {
  try {
    await connectDB();
    const { url } = await params;
    const session = await getSessionFromRequest(req);

    // Find by URL slug (the pretty URL, not _id)
    const blog = await Blog.findOne({ url }).lean();
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const blogId = blog._id as mongoose.Types.ObjectId;

    // Fetch like count and user's like status in parallel
    const [likeCount, commentCount, userLike] = await Promise.all([
      Like.countDocuments({ blogId }),
      Comment.countDocuments({ blogId }),
      session?.userId && mongoose.Types.ObjectId.isValid(session.userId)
        ? Like.findOne({ blogId, userId: new mongoose.Types.ObjectId(session.userId) }).lean()
        : null,
    ]);

    // Increment views (fire-and-forget — non-blocking)
    Blog.updateOne({ url }, { $inc: { views: 1 } }).exec();

    return NextResponse.json({
      blog: {
        ...blog,
        likeCount,
        commentCount,
        isLikedByUser: !!userLike,
      },
    });
  } catch (error) {
    console.error("Fetch blog error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ url: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { url } = await params;
    const body = await req.json();
    const { title, content, category, tags, thumbnail, contentType } = body;

    const blog = await Blog.findOne({ url });
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Authorization: Original author or admin
    const isAuthor = blog.authorId.toString() === session.userId;
    const isAdmin = session.role === "admin";

    if (!isAuthor && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Update fields
    if (title !== undefined) blog.title = title;
    if (content !== undefined) blog.body = content;
    if (category !== undefined) blog.category = category;
    if (tags !== undefined) blog.tags = tags;
    if (thumbnail !== undefined) blog.thumbnail = thumbnail;
    if (contentType !== undefined) blog.contentType = contentType;

    await blog.save();

    return NextResponse.json({ message: "Blog updated successfully", blog });
  } catch (error) {
    console.error("Update blog error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
