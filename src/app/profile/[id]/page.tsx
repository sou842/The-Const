"use client";

import { use } from "react";
import useSWR from "swr";
import Link from "next/link";
import { MapPin, Calendar, Loader2 } from "lucide-react";
import { SkeletonLoader } from "@/components/common/skeleton/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PostCard } from "@/components/feed/PostCard";
import { ConnectionButton } from "@/components/network/ConnectionButton";
import { getter, preventRerendering } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { BlogPost } from "@/types/blog";

export default function PublicProfile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user: currentUser } = useAuth();
  
  const { data, isLoading: profileLoading } = useSWR(`/api/users/${id}`, getter, preventRerendering);
  const { data: blogsData, isLoading: blogsLoading } = useSWR(`/api/users/${id}/blogs`, getter, preventRerendering);
  
  const profile = data?.user;
  const isOwnProfile = currentUser?._id === id;

  if (profileLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[500px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </AppLayout>
    );
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center min-h-[500px] text-muted-foreground gap-4">
          <p>User not found.</p>
          <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="pb-20 md:pb-4">
        {/* Cover */}
        <div className="relative h-48 rounded-xl overflow-hidden border bg-muted">
          {profile.bannerPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.bannerPhoto}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-linear-to-r from-primary/20 to-primary/10" />
          )}
        </div>

        {/* Profile info */}
        <div className="relative px-4 pb-4">
          <Avatar className="h-24 w-24 border-4 border-card -mt-12 relative z-10 bg-muted">
            <AvatarImage src={profile.profilePhoto} />
            <AvatarFallback className="text-2xl">{profile.name.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="flex flex-col sm:flex-row sm:items-start justify-between mt-3 gap-4">
            <div>
              <h1 className="text-2xl font-bold">{profile.name}</h1>
              {profile.profession && (
                <p className="text-sm text-foreground mt-0.5">
                  {profile.profession}
                </p>
              )}
              
              {profile.shortBio && (
                <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                  {profile.shortBio}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                {profile.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {profile.location}</span>
                )}
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isOwnProfile ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href="/profile">Edit Profile</Link>
                </Button>
              ) : (
                <ConnectionButton targetUserId={id} size="default" />
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="posts" className="mt-2">
          <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-0">
            <TabsTrigger value="posts" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5">
              Posts
            </TabsTrigger>
            <TabsTrigger value="about" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5">
              About
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="space-y-4 mt-4">
            {blogsLoading ? (
              <SkeletonLoader type="feed" />
            ) : blogsData?.blogs?.length > 0 ? (
              blogsData.blogs.map((blog: BlogPost) => (
                <PostCard 
                  key={blog._id} 
                  {...blog} 
                />
              ))
            ) : (
              <div className="text-sm text-muted-foreground text-center py-10 bg-card rounded-xl border border-dashed">
                No posts published yet.
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="about" className="mt-4">
            <div className="bg-card rounded-xl border p-5 space-y-4">
              <div>
                <h3 className="font-display font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {profile.longBio || "No bio added yet."}
                </p>
              </div>
              
              {profile.expertise && profile.expertise.length > 0 && (
                <div>
                  <h3 className="font-display font-semibold mb-2">Skills / Expertise</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.expertise.map((s: string) => (
                      <span key={s} className="px-3 py-1 bg-muted rounded-full text-xs font-medium">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <MobileNav />
    </AppLayout>
  );
}
