import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import connectDB from "@/lib/db";
import { AIActionLog } from "@/models/AIActionLog";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '50');

    await connectDB();

    const query = userId ? { userId } : {};
    const logs = await AIActionLog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json(logs);
  } catch (error) {
    console.error("Fetch AI logs error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
