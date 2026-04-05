import { NextRequest, NextResponse } from "next/server";
import { getExploreData } from "@/lib/server/blogs";
import { getCache, setCache } from "@/lib/memoryCache";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "latest";

    const cacheKey = `explore:${query}:${category}:${sort}`;
    const cached = getCache<{ blogs: unknown[]; categories: string[]; trendingTags: unknown[] }>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const data = await getExploreData({
      query,
      category,
      sort: sort as "latest" | "popular" | "trending",
    });

    setCache(cacheKey, data, 60000);
    return NextResponse.json(data);
  } catch (err: unknown) {
    console.error("Explore API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
