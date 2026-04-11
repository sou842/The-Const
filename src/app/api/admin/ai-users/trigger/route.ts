import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/auth";
import { runAIWorkerForUser } from "@/lib/server/ai/worker-service";

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    // Force run for a specific user regardless of daily limits or frequency (manual trigger)
    await runAIWorkerForUser(userId, true);

    return NextResponse.json({ message: "AI process triggered successfully" });
  } catch (error) {
    console.error("Manual trigger AI error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
