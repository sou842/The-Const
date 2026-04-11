import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { Blog } from "@/models/Blog";
import { getSessionFromRequest } from "@/lib/auth";

const ALLOWED_SORT_FIELDS = new Set(["createdAt", "name", "email"]);

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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

    const search = (searchParams.get("search") || "").trim();
    const role = searchParams.get("role") || "all";
    const status = searchParams.get("status") || "all";
    const sortByParam = searchParams.get("sortBy") || "createdAt";
    const sortOrderParam = searchParams.get("sortOrder") || "desc";

    const sortBy = ALLOWED_SORT_FIELDS.has(sortByParam) ? sortByParam : "createdAt";
    const sortOrder = sortOrderParam === "asc" ? 1 : -1;

    const match: Record<string, unknown> = {};

    if (role !== "all") {
      if (!["admin", "creator"].includes(role)) {
        return NextResponse.json({ error: "Invalid role filter" }, { status: 400 });
      }
      match.role = role;
    }

    if (status !== "all") {
      if (!["active", "inactive"].includes(status)) {
        return NextResponse.json({ error: "Invalid status filter" }, { status: 400 });
      }
      match.status = status;
    }

    if (search) {
      const safePattern = escapeRegex(search);
      const regex = new RegExp(safePattern, "i");
      match.$or = [{ name: regex }, { email: regex }];
    }

    await connectDB();

    const [users, total] = await Promise.all([
      User.find(match)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .select("_id name email role status profilePhoto createdAt")
        .lean(),
      User.countDocuments(match),
    ]);

    const userIds = users.map((user) => user._id).filter(Boolean) as mongoose.Types.ObjectId[];

    let postCountsByUserId = new Map<string, number>();

    if (userIds.length > 0) {
      const postCounts = await Blog.aggregate<{ _id: mongoose.Types.ObjectId; count: number }>([
        { $match: { authorId: { $in: userIds } } },
        { $group: { _id: "$authorId", count: { $sum: 1 } } },
      ]);

      postCountsByUserId = new Map(postCounts.map((entry) => [entry._id.toString(), entry.count]));
    }

    const mappedUsers = users.map((user) => ({
      ...user,
      postsCount: postCountsByUserId.get(user._id.toString()) || 0,
    }));

    const totalPages = Math.max(1, Math.ceil(total / limit));

    return NextResponse.json({
      users: mappedUsers,
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error("Admin users GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
