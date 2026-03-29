import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import { getSessionFromRequest } from "@/lib/auth";

// GET all blogs (any status) - for admin panel
export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
    await connectDB();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "pending";
    const blogs = await Blog.find({ status }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ blogs });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
