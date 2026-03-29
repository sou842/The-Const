"use client";

import Link from "next/link";
import useSWR from "swr";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { PostCard } from "@/components/feed/PostCard";
import { CreatePost } from "@/components/feed/CreatePost";

import type { BlogPost } from "@/types/blog";
import { getter, preventRerendering } from "@/lib/api";
import { SkeletonLoader } from "@/components/common/skeleton/skeleton";


export default function Home() {
  const { data, error, isLoading } = useSWR("/api/blogs?limit=20", getter, preventRerendering);

  const blogs: BlogPost[] = data?.blogs ?? [];

  console.log(blogs, "tara blogs")

  return (
    <AppLayout>
      <div className="w-full flex flex-row">
        <div className="w-full space-y-4 pb-20 md:pb-4">
          <CreatePost />

          {isLoading ? (
            <SkeletonLoader type="feed" />
          ) : error ? (
            <div className="text-center py-16 bg-card rounded-xl border border-dashed text-destructive">
              <p className="text-sm">Failed to load feed. Please check your connection.</p>
            </div>
          ) : blogs?.length > 0 ? (
            blogs?.map((blog) => (
              <PostCard
                key={blog._id}
                {...blog}
              />
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
      {/* <RightSidebar /> */}
      </div>
      <MobileNav />
    </AppLayout>
  );
}
