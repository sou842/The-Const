import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";

export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("x-api-token");
    const validToken = process.env.EXTERNAL_API_TOKEN || "fallback_development_token_change_me";

    if (!token || token !== validToken) {
      return NextResponse.json({ error: "Unauthorized: Invalid or missing API token" }, { status: 401 });
    }

    await connectDB();
    const payload = await req.json();

    const { title, body, authorId } = payload;

    if (!title || !body || !authorId) {
      return NextResponse.json(
        { error: "Missing required fields: title, body, and authorId are required" },
        { status: 400 }
      );
    }

    const newBlog = new Blog({
      ...payload,
      status: 'pending', // Force draft/pending status so admin must approve
      isTrending: false, // Don't allow them to auto-trend
    });

    await newBlog.save();

    return NextResponse.json({ message: "Blog successfully ingested", blogId: newBlog._id }, { status: 201 });
  } catch (error) {
    console.error("Ingestion API error:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
