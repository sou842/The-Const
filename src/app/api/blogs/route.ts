import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import connectDB from "@/lib/db";
import { getCache, setCache } from "@/lib/memoryCache";
import { getFeedBlogs } from "@/lib/server/blogs";
import { Blog } from "@/models/Blog";

// GET - Fetch all approved blogs for the feed
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    if (!session?.userId) {
      const cacheKey = `feed:anon:${page}:${limit}`;
      const cached = getCache<{ blogs: unknown[]; total: number; page: number; totalPages: number }>(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }
      const data = await getFeedBlogs({ page, limit, userId: null });
      setCache(cacheKey, data, 20000);
      return NextResponse.json(data);
    }

    const data = await getFeedBlogs({ page, limit, userId: session.userId });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Fetch blogs error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// POST - Create a new blog (auth required)
export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { title, content, category, tags, thumbnail, language, url, contentType } = body;

    if (!title || !content || !category) {
      return NextResponse.json({ error: "Title, content, and category are required" }, { status: 400 });
    }

    const blog = new Blog({
      title,
      body: content,
      thumbnail: thumbnail || {},
      category,
      tags: tags || [],
      author: session.name,
      authorId: session.userId,
      publishedDate: new Date(),
      status: "pending",
      editorType: "EDITORJS",
      language: language || "en",
      url: url || "", // generation handled by hook if empty
      contentType: contentType || "blog",
    });

    await blog.save();

    return NextResponse.json({ message: "Blog created successfully", blog }, { status: 201 });
  } catch (error) {
    console.error("Create blog error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
