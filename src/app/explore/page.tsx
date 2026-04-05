import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { getExploreData } from "@/lib/server/blogs";
import { ExploreClient } from "@/components/explore/ExploreClient";
import { Blog } from "@/types/blog";

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
