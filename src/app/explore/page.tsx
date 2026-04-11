import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { getExploreData } from "@/lib/server/blogs";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { Blog } from "@/types/blog";
import { absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Explore Insights and Trending Topics",
  description:
    "Browse trending articles, industries, and conversations from professionals across The Const.",
  alternates: {
    canonical: absoluteUrl("/explore"),
  },
};

export default async function Explore() {
  let initialBlogs: Blog[] = [];
  let initialTrending: { tag: string; posts: number }[] = [];
  try {
    const data = await getExploreData({ query: "", sort: "popular" });
    initialBlogs = data.blogs || [];
    initialTrending = data.trendingTags || [];
  } catch {
    initialBlogs = [];
    initialTrending = [];
  }

  return (
    <AppLayout>
      <ExploreClient initialBlogs={initialBlogs} initialTrending={initialTrending} />
      <MobileNav />
    </AppLayout>
  );
}
