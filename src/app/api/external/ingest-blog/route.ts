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

    const { title, content, excerpt, tags, authorId } = payload;

    if (!title || !content || !authorId) {
      return NextResponse.json(
        { error: "Missing required fields: title, content, and authorId are required" },
        { status: 400 }
      );
    }

    // Convert raw content string into EditorJS blocks format
    const editorJsBody = [
      {
        id: Math.random().toString(36).substring(2, 9),
        type: "paragraph",
        data: {
          text: content
        }
      }
    ];

    const newBlog = new Blog({
      title,
      body: editorJsBody,
      thumbnail: {
        description: excerpt || "",
      },
      category: (tags && tags.length > 0) ? tags[0] : "General",
      tags: tags || [],
      // Author name implies we might need a lookup, but for external ingest we can fallback or require more info
      author: "External System", 
      authorId: authorId,
      publishedDate: new Date(),
      status: "approved", // auto-approve external ingests? Or pending. We'll set approved for display.
      editorType: "EDITORJS",
      language: "en",
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
