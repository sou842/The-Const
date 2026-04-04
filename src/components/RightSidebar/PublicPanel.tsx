"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const PublicPanel = () => {
  const { data: exploreData, isLoading: isLoadingTrending } = useSWR(
    "/api/blogs/explore?sort=trending",
    fetcher,
    { revalidateOnFocus: false }
  );

  const { data: networkData, isLoading: isLoadingSuggestions } = useSWR(
    "/api/network/suggestions?limit=5",
    fetcher,
    { revalidateOnFocus: false }
  );

  const trendingTopics = exploreData?.trendingTags || [];
  const suggestedUsers = networkData?.suggestions || [];

  return (
    <aside className="hidden xl:flex fixed right-0 top-14 bottom-0 w-80 bg-card border-l flex-col py-4 z-40 p-4 overflow-y-auto">
      <div className="mb-6">
        <h3 className="font-display font-semibold text-sm mb-3">Trending Topics</h3>
        <div className="space-y-2.5">
          {isLoadingTrending ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))
          ) : trendingTopics.length > 0 ? (
            trendingTopics.map((topic: { tag: string; posts: number }) => (
              <div key={topic.tag} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{topic.tag}</p>
                  <p className="text-xs text-muted-foreground">{topic.posts} posts</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No trending topics yet</p>
          )}
        </div>
      </div>

      <div>
        <h3 className="font-display font-semibold text-sm mb-3">People You May Know</h3>
        <div className="space-y-3">
          {isLoadingSuggestions ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-7 w-16 rounded-md" />
              </div>
            ))
          ) : suggestedUsers.length > 0 ? (
            suggestedUsers.map((user: { _id: string; name: string; profilePhoto?: string; profession?: string; }) => (
              <div key={user._id} className="flex items-center gap-3">
                <Link href={`/profile/${user._id}`}>
                  <Avatar className="h-9 w-9 border">
                    <AvatarImage src={user.profilePhoto} />
                    <AvatarFallback>{user.name?.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/profile/${user._id}`}>
                    <p className="text-sm font-medium truncate hover:underline">{user.name}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground truncate">{user.profession || "Member"}</p>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" asChild>
                  <Link href={`/profile/${user._id}`}>View</Link>
                </Button>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No suggestions available</p>
          )}
        </div>
      </div>

      <div className="mt-auto pt-4 border-t">
        <p className="text-xs text-muted-foreground">
          Have a story to share?{" "}
          <Link href="/write" className="text-primary font-medium hover:underline">
            Write a blog
          </Link>
        </p>
      </div>
    </aside>
  );
};

export default PublicPanel;