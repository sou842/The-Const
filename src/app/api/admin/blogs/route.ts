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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "0");
    const skip = (page - 1) * limit;

    const [blogs, total] = await Promise.all([
      Blog.find({ status })
        .sort({ createdAt: -1 })
        .skip(limit > 0 ? skip : 0)
        .limit(limit > 0 ? limit : 0)
        .select("title author category tags thumbnail url createdAt status")
        .lean(),
      Blog.countDocuments({ status }),
    ]);

    const totalPages = limit > 0 ? Math.ceil(total / limit) : 1;
    return NextResponse.json({ blogs, total, page, totalPages });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
