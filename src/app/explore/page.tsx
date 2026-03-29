import { TrendingUp, Hash } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { PostCard } from "@/components/feed/PostCard";
import { posts, trendingTopics } from "@/data/mockData";

export default function Explore() {
  return (
    <AppLayout>
      <div className="pb-20 md:pb-4 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Explore</h1>
          </div>

          <div className="bg-card rounded-xl border p-4 mb-6">
            <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" /> Trending Now
            </h3>
            <div className="flex flex-wrap gap-2">
              {trendingTopics.map((t) => (
                <button
                  key={t.tag}
                  className="px-4 py-2 bg-muted rounded-full text-sm font-medium hover:bg-accent transition-colors"
                >
                  {t.tag}
                  <span className="text-xs text-muted-foreground ml-2">{t.posts}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold mb-4">Popular Posts</h2>
          <div className="space-y-4">
            {posts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>
        </div>
      </div>
      <MobileNav />
    </AppLayout>
  );
}
