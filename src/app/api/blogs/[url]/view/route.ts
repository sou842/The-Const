import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ url: string }> }) {
  try {
    await connectDB();
    const { url } = await params;

    // Increment views (fire-and-forget logic if we don't need the result immediately)
    const result = await Blog.updateOne({ url }, { $inc: { views: 1 } });

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Increment view error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
