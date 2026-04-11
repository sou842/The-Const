import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { Blog } from "@/models/Blog";
import { Report } from "@/models/Report";

const VALID_REASONS = ["spam", "harassment", "misinformation", "hate", "violence", "other"] as const;
const DETAILS_MAX_LENGTH = 1000;
const DETAILS_MIN_LENGTH = 10;

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const blogId = typeof body.blogId === "string" ? body.blogId : "";
    const reason = typeof body.reason === "string" ? body.reason : "";
    const details = typeof body.details === "string" ? body.details.trim() : "";

    if (!blogId || !mongoose.Types.ObjectId.isValid(blogId)) {
      return NextResponse.json({ error: "Invalid blog id" }, { status: 400 });
    }

    if (!VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
      return NextResponse.json({ error: "Invalid report reason" }, { status: 400 });
    }

    if (details.length < DETAILS_MIN_LENGTH || details.length > DETAILS_MAX_LENGTH) {
      return NextResponse.json(
        { error: `Details must be between ${DETAILS_MIN_LENGTH} and ${DETAILS_MAX_LENGTH} characters` },
        { status: 400 },
      );
    }

    await connectDB();

    const blog = await Blog.findById(blogId).select("_id").lean();
    if (!blog) {
      return NextResponse.json({ error: "Blog not found" }, { status: 404 });
    }

    const existingPending = await Report.findOne({
      targetType: "blog",
      targetId: new mongoose.Types.ObjectId(blogId),
      reporterId: new mongoose.Types.ObjectId(session.userId),
      status: "pending",
    })
      .select("_id")
      .lean();

    if (existingPending) {
      return NextResponse.json({ error: "You already have a pending report for this article" }, { status: 409 });
    }

    const report = await Report.create({
      targetType: "blog",
      targetId: blogId,
      reporterId: session.userId,
      reason,
      details,
      status: "pending",
      adminAction: "none",
    });

    return NextResponse.json(
      {
        report: {
          id: report._id,
          status: report.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create report error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
