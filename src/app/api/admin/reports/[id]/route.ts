import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { Report } from "@/models/Report";
import { Blog } from "@/models/Blog";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const action = typeof body.action === "string" ? body.action : "";

    if (!["dismiss", "remove"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    await connectDB();

    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.targetType !== "blog") {
      return NextResponse.json({ error: "Unsupported report target" }, { status: 400 });
    }

    if (action === "dismiss") {
      report.status = "dismissed";
      report.adminAction = "dismissed";
      report.resolvedAt = new Date();
      report.resolvedBy = session.userId;
      await report.save();

      return NextResponse.json({
        report: {
          id: report._id,
          status: report.status,
          adminAction: report.adminAction,
        },
      });
    }

    const blog = await Blog.findById(report.targetId);
    if (!blog) {
      return NextResponse.json({ error: "Reported blog not found" }, { status: 404 });
    }

    blog.status = "rejected";
    await blog.save();

    report.status = "resolved";
    report.adminAction = "rejected_blog";
    report.resolvedAt = new Date();
    report.resolvedBy = session.userId;
    await report.save();

    return NextResponse.json({
      report: {
        id: report._id,
        status: report.status,
        adminAction: report.adminAction,
      },
      blog: {
        id: blog._id,
        status: blog.status,
      },
    });
  } catch (error) {
    console.error("Admin report PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
