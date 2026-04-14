import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { AIActionLog } from "@/models/AIActionLog";
import { getSessionFromRequest } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const skip = parseInt(searchParams.get('skip') || '0');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    await connectDB();

    const logs = await AIActionLog.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AIActionLog.countDocuments({ userId });
    const hasMore = skip + logs.length < total;

    return NextResponse.json({
      logs,
      hasMore,
      total,
      skip,
      limit
    });
  } catch (error) {
    console.error("Fetch AI logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
