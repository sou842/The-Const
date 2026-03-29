import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import { getSessionFromRequest } from "@/lib/auth";

// PUT - Approve or reject a blog
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { id } = await params;
    const { status } = await req.json();

    if (!["approved", "rejected", "pending"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const blog = await Blog.findById(id);

    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    // Check if the user is admin or the actual author
    const isOwner = blog.authorId.toString() === session.userId;
    const isAdmin = session.role === "admin";

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Unauthorized to update this blog's status" }, { status: 403 });
    }

    blog.status = status;
    if (status === "approved") {
      blog.publishedDate = new Date();
    }
    await blog.save();

    return NextResponse.json({ message: `Blog ${status}`, blog });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
