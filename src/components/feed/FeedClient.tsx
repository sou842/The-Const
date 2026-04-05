"use client";

import Link from "next/link";
import useSWR from "swr";
import { PostCard } from "@/components/feed/PostCard";
import { CreatePost } from "@/components/feed/CreatePost";
import { SkeletonLoader } from "@/components/common/skeleton/skeleton";
import type { BlogPost } from "@/types/blog";
import { getter, preventRerendering } from "@/lib/api";

interface FeedClientProps {
  initialBlogs: BlogPost[];
  initialError?: boolean;
}

export function FeedClient({ initialBlogs, initialError }: FeedClientProps) {
  const { data, error, isLoading } = useSWR(
    "/api/blogs?limit=20",
    getter,
    {
      ...preventRerendering,
      revalidateIfStale: true,
      revalidateOnMount: true,
      fallbackData: { blogs: initialBlogs },
    }
  );

  const blogs: BlogPost[] = data?.blogs ?? [];

  return (
    <div className="w-full flex flex-row">
      <div className="w-full space-y-4 pb-20 md:pb-4">
        <CreatePost />

        {isLoading ? (
          <SkeletonLoader type="feed" />
        ) : error || initialError ? (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed text-destructive">
            <p className="text-sm">Failed to load feed. Please check your connection.</p>
          </div>
        ) : blogs?.length > 0 ? (
          blogs?.map((blog, index) => (
            <PostCard key={blog._id} {...blog} imagePriority={index === 0} />
          ))
        ) : (
          <div className="text-center py-16 bg-card rounded-xl border border-dashed">
            <p className="text-muted-foreground text-sm">No approved posts yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Be the first to{" "}
              <Link href="/write" className="text-primary hover:underline">
                write a blog
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
