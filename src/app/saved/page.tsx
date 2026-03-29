"use client";

import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { PostCard } from "@/components/feed/PostCard";
import { Bookmark, Loader2 } from "lucide-react";
import useSWR from "swr";
import { getter } from "@/lib/api";

export default function Saved() {
  const { data, isLoading } = useSWR('/api/saved', getter);
  const savedBlogs = data?.savedBlogs || [];

  return (
    <AppLayout>
      <div className="pb-20 md:pb-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-2 mb-6 px-2">
          <Bookmark className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Saved Posts</h1>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : savedBlogs.length === 0 ? (
            <div className="text-center py-24 bg-card/50 rounded-2xl border border-dashed border-border/60">
              <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-lg font-medium text-foreground/80 mb-1">No saved posts</p>
              <p className="text-sm text-muted-foreground">Bookmark articles to read them later.</p>
            </div>
          ) : (
            <>
              {savedBlogs.map((post: Record<string, unknown> & { _id: string; authorId?: { name?: string }; author?: string }) => (
                <PostCard 
                  key={post._id} 
                  {...post} 
                  isSaved={true} 
                  creator={post.authorId} 
                  author={post.authorId?.name || post.author || "Unknown User"} 
                />
              ))}
              <div className="text-center py-10 text-xs text-muted-foreground">
                <p>You have reached the end of your saved posts.</p>
              </div>
            </>
          )}
        </div>
      </div>
      <MobileNav />
    </AppLayout>
  );
}
