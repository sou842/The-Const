import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);

    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const sort = searchParams.get("sort") || "latest";

    // Build the query object
    const filter: any = { status: "approved" };

    if (query) {
      filter.$or = [
        { title: { $regex: query, $options: "i" } },
        { tags: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ];
    }

    if (category && category !== "All") {
      filter.category = category;
    }

    // Build the sort object
    let sortOptions: any = { createdAt: -1 };
    if (sort === "trending") sortOptions = { isTrending: -1, views: -1 };
    if (sort === "popular") sortOptions = { views: -1 };
    if (sort === "latest") sortOptions = { publishedDate: -1 };

    const blogs = await Blog.find(filter)
      .sort(sortOptions)
      .limit(20)
      .populate("authorId", "name profilePhoto username");

    // Also get all unique categories for the chips
    const categories = await Blog.distinct("category", { status: "approved" });

    // Get trending tags (simplified: most common tags in the last 20 posts)
    const latestBlogs = await Blog.find({ status: "approved" }).sort({ createdAt: -1 }).limit(20);
    const tagCounts: Record<string, number> = {};
    latestBlogs.forEach((blog) => {
      blog.tags?.forEach((tag: string) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });
    
    const trendingTags = Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, posts: count }));

    return NextResponse.json({
      blogs,
      categories: ["All", ...categories],
      trendingTags,
    });
  } catch (err: unknown) {
    console.error("Explore API error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Internal server error" },
      { status: 500 }
    );
  }
}
