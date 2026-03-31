"use client";

import { useState } from "react";
import { TrendingUp, Hash } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { PostCard } from "@/components/feed/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import useSWR from "swr";
import { useDebounce } from "@/hooks/use-debounce";
import { getter } from "@/lib/api";

interface Blog {
  _id: string;
  title: string;
  author: string;
  authorId: {
    _id: string;
    name: string;
    profilePhoto?: string;
    username?: string;
    profession?: string;
  };
  category: string;
  url: string;
  thumbnail: {
    image?: string;
    title?: string;
  };
  views: number;
  createdAt: string;
}

interface TrendingTag {
  tag: string;
  posts: number;
}

export default function Explore() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  const { data, isLoading } = useSWR(
    `/api/blogs/explore?q=${debouncedSearchQuery}&sort=popular`,
    getter
  );

  const blogs: Blog[] = data?.blogs || [];
  const trendingTags: TrendingTag[] = data?.trendingTags || [];

  return (
    <AppLayout>
      <div className="pb-20 md:pb-4 space-y-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Explore</h1>
          </div>

          {/* Minimal Search Bar based on original UI needs */}
          {/* <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search trending topics..." 
              className="pl-10 h-10 bg-muted/50 border-none rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div> */}

          <div className="bg-card rounded-xl border p-4 mb-6">
            <h3 className="font-display font-semibold text-sm mb-3 flex items-center gap-2">
              <Hash className="h-4 w-4" /> Trending Now
            </h3>
            <div className="flex flex-wrap gap-2">
              {isLoading && trendingTags.length === 0 ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-9 w-24 rounded-full" />
                ))
              ) : (
                trendingTags.map((t: TrendingTag) => (
                  <button
                    key={t.tag}
                    onClick={() => setSearchQuery(t.tag)}
                    className="px-4 py-2 bg-muted rounded-full text-sm font-medium hover:bg-accent hover:text-primary transition-all flex items-center gap-2"
                  >
                    #{t.tag}
                    <span className="text-xs text-muted-foreground opacity-60">{t.posts}</span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="font-display font-semibold mb-4">Popular Posts</h2>
          <div className="space-y-4">
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-4 p-4 border rounded-xl animate-pulse">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-40 w-full rounded-lg" />
                </div>
              ))
            ) : blogs.length > 0 ? (
              blogs.map((blog: Blog) => (
                <PostCard 
                  key={blog._id} 
                  _id={blog._id}
                  title={blog.title}
                  author={blog.author}
                  creator={blog.authorId}
                  category={blog.category}
                  url={blog.url}
                  thumbnail={blog.thumbnail}
                  views={blog.views}
                  createdAt={blog.createdAt}
                />
              ))
            ) : (
              <div className="text-center py-10 opacity-60">
                <p>No results found for your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <MobileNav />
    </AppLayout>
  );
}
