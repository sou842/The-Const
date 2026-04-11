import { NextRequest, NextResponse } from "next/server";
import type { PipelineStage } from "mongoose";
import connectDB from "@/lib/db";
import { getSessionFromRequest } from "@/lib/auth";
import { Report } from "@/models/Report";

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const VALID_STATUSES = ["pending", "dismissed", "resolved"] as const;
const VALID_REASONS = ["spam", "harassment", "misinformation", "hate", "violence", "other"] as const;

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rawPage = Number.parseInt(searchParams.get("page") || "1", 10);
    const rawLimit = Number.parseInt(searchParams.get("limit") || "10", 10);

    const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
    const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 100) : 10;
    const skip = (page - 1) * limit;

    const status = searchParams.get("status") || "all";
    const reason = searchParams.get("reason") || "all";
    const search = (searchParams.get("search") || "").trim();

    if (status !== "all" && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
    }

    if (reason !== "all" && !VALID_REASONS.includes(reason as (typeof VALID_REASONS)[number])) {
      return NextResponse.json({ error: "Invalid reason filter" }, { status: 400 });
    }

    await connectDB();

    const match: Record<string, unknown> = { targetType: "blog" };
    if (status !== "all") match.status = status;
    if (reason !== "all") match.reason = reason;

    const safeSearch = escapeRegex(search);
    const searchMatch: PipelineStage.Match | null = search
      ? {
          $match: {
            $or: [
              { details: { $regex: safeSearch, $options: "i" } },
              { reason: { $regex: safeSearch, $options: "i" } },
              { "reporter.name": { $regex: safeSearch, $options: "i" } },
              { "reporter.email": { $regex: safeSearch, $options: "i" } },
              { "blog.title": { $regex: safeSearch, $options: "i" } },
              { "blog.author": { $regex: safeSearch, $options: "i" } },
            ],
          },
        }
      : null;

    const lookupStages: PipelineStage[] = [
      {
        $lookup: {
          from: "users",
          localField: "reporterId",
          foreignField: "_id",
          as: "reporter",
        },
      },
      {
        $unwind: {
          path: "$reporter",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $lookup: {
          from: "blogs",
          localField: "targetId",
          foreignField: "_id",
          as: "blog",
        },
      },
      {
        $unwind: {
          path: "$blog",
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    const dataPipeline: PipelineStage[] = [
      { $match: match },
      ...lookupStages,
      ...(searchMatch ? [searchMatch] : []),
      { $sort: { createdAt: -1 as const } },
      { $skip: skip },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          reason: 1,
          details: 1,
          status: 1,
          adminAction: 1,
          createdAt: 1,
          resolvedAt: 1,
          reporter: {
            _id: "$reporter._id",
            name: "$reporter.name",
            email: "$reporter.email",
            profilePhoto: "$reporter.profilePhoto",
          },
          blog: {
            _id: "$blog._id",
            title: "$blog.title",
            author: "$blog.author",
            status: "$blog.status",
            url: "$blog.url",
            summary: "$blog.thumbnail.description",
          },
        },
      },
    ];

    const countPipeline: PipelineStage[] = [
      { $match: match },
      ...lookupStages,
      ...(searchMatch ? [searchMatch] : []),
      { $count: "total" },
    ];

    const summaryPipeline: PipelineStage[] = [
      { $match: { targetType: "blog" } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ];

    const [reports, countResult, summaryResult] = await Promise.all([
      Report.aggregate(dataPipeline),
      Report.aggregate(countPipeline),
      Report.aggregate(summaryPipeline),
    ]);

    const total = countResult[0]?.total || 0;
    const summary = { pending: 0, dismissed: 0, resolved: 0 };

    for (const row of summaryResult) {
      if (row._id in summary) {
        summary[row._id as keyof typeof summary] = row.count;
      }
    }

    return NextResponse.json({
      reports,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      summary,
    });
  } catch (error) {
    console.error("Admin reports GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
