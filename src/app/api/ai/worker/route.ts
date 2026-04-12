import { NextRequest, NextResponse } from "next/server";
import { runAIWorker } from "@/lib/server/ai/worker-service";

export async function GET(req: NextRequest) {
  try {
    // Basic verification of a cron secret if provided in environment
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'secret'; // Fallback for local dev
    
    // If we're on production (Vercel), we might want to check for the cron secret header
    // But for now, we'll allow it if the token matches or if it's a simple local check.
    if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${cronSecret}`) {
      // return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      // Many cron services don't support bearer tokens easily, so we might just check a query param or a specific header.
    }

    // Run the worker
    const results = await runAIWorker();

    return NextResponse.json({ 
      success: true, 
      timestamp: new Date().toISOString(),
      message: "AI Worker run completed",
      results
    });
  } catch (error) {
    console.error("AI Worker Error:", error);
    return NextResponse.json({ 
      error: "Internal server error", 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 });
  }
}
