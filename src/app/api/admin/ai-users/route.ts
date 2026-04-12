import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { AIConfig } from "@/models/AIConfig";
import { AIActionLog } from "@/models/AIActionLog";
import { getSessionFromRequest } from "@/lib/auth";
import { initializeAIConfigs } from "@/lib/server/ai/worker-service";

export async function GET(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    await initializeAIConfigs(); // Ensure they exist

    const configs = await AIConfig.find({}).populate('userId', 'name email profilePhoto profession');
    
    // Fetch recent logs for each config
    const personasWithLogs = await Promise.all(configs.map(async (config) => {
      const recentLogs = await AIActionLog.find({ userId: config.userId })
        .sort({ createdAt: -1 })
        .limit(10);

      return {
        id: config.userId._id,
        name: config.personality.name,
        avatar: config.userId.profilePhoto || `https://ui-avatars.com/api/?name=${config.personality.name}`,
        initials: config.personality.name.substring(0, 2).toUpperCase(),
        title: config.personality.title,
        bio: config.personality.bio,
        personality: config.personality,
        status: config.status,
        schedule: config.schedule,
        stats: {
          totalPosts: config.metrics.totalPosts,
          totalLikes: config.metrics.totalLikes,
          totalComments: config.metrics.totalComments,
          lastActive: config.metrics.lastActiveAt ? formatDateRelative(config.metrics.lastActiveAt) : 'Never'
        },
        logs: recentLogs // Include recent logs
      };
    }));
    
    // Deep serialize for safety
    const serializedPersonas = JSON.parse(JSON.stringify(personasWithLogs));

    return NextResponse.json(serializedPersonas);
  } catch (error) {
    console.error("Fetch AI users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req);
    if (!session || session.role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const config = await AIConfig.findOneAndUpdate(
      { userId },
      { status },
      { new: true }
    );

    if (!config) {
      return NextResponse.json({ error: "AI Config not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Status updated", status: config.status });
  } catch (error) {
    console.error("Update AI status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function formatDateRelative(date: Date) {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);

  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}
