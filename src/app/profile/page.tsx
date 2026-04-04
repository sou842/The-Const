"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { MapPin, Calendar, Edit, Loader2 } from "lucide-react";
import { SkeletonLoader } from "@/components/common/skeleton/skeleton";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PostCard } from "@/components/feed/PostCard";
import { getter, putter, preventRerendering } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import type { BlogPost } from "@/types/blog";

export default function Profile() {
  const { user, loading: authLoading, refresh } = useAuth();
  const { data, isLoading: profileLoading, mutate } = useSWR(user ? "/api/users/profile" : null, getter, preventRerendering);
  const { data: blogsData, isLoading: blogsLoading, mutate: mutateBlogs } = useSWR(user ? "/api/users/profile/blogs" : null, getter, preventRerendering);
  const { data: connectionsData } = useSWR(user ? "/api/network/connections" : null, getter, { revalidateOnFocus: false });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    profession: "",
    location: "",
    shortBio: "",
    longBio: "",
    profilePhoto: "",
    bannerPhoto: "",
  });

  const profile = data?.user;

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || "",
        profession: profile.profession || "",
        location: profile.location || "",
        shortBio: profile.shortBio || "",
        longBio: profile.longBio || "",
        profilePhoto: profile.profilePhoto || "",
        bannerPhoto: profile.bannerPhoto || "",
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return;
    }
    
    setSaving(true);
    try {
      await putter("/api/users/profile", formData);
      toast.success("Profile updated");
      setIsEditing(false);
      
      // Refresh local cache and global auth state
      await mutate();
      await refresh();
    } catch (error) {
      // putter already handles error toast
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleStatusUpdate = async (blogId: string, newStatus: string) => {
    try {
      await putter(`/api/admin/blogs/${blogId}`, { status: newStatus });
      toast.success(`Post ${newStatus}`);
      await mutateBlogs();
    } catch (error) {
      console.error("Status update error:", error);
    }
  };

    const postToApi = async (retryCount = 0): Promise<void> => {
    try {
      console.log(`[Executor] Posting to ingest API (attempt ${retryCount + 1}/5)...`);
      const response = await fetch('http://localhost:3000/api/external/ingest-blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-token': 'fallback_development_token_change_me',
        },
        body: JSON.stringify(testblog),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('[Executor] Successfully ingested blog via API:', result);
    } catch (e) {
      console.error(`[Executor] API call failed (attempt ${retryCount + 1}):`, e);
      if (retryCount < 4) {
        // Wait 2 seconds between retries
        await new Promise(r => setTimeout(r, 2000));
        await postToApi(retryCount + 1);
      } else {
        console.error('[Executor] API call failed after 5 attempts. Giving up.');
      }
    }
  };

  if (authLoading || profileLoading) {
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
        <div className="flex items-center justify-center min-h-[500px] text-muted-foreground">
          Error loading profile.
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
              <p className="text-sm text-foreground mt-0.5">
                {profile.profession || "Add a profession"}
              </p>
              
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
              <div className="flex items-center gap-4 mt-3 text-sm">
                <span><strong>{connectionsData?.total ?? 0}</strong> <span className="text-muted-foreground">connections</span></span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 shrink-0" onClick={() => setIsEditing(true)}>
              <Edit className="h-3.5 w-3.5" /> Edit Profile
            </Button>
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
                  onStatusUpdate={(status) => handleStatusUpdate(blog._id, status)}
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

      {/* Edit Profile Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Make changes to your profile here. Click save when you&apos;re done.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input 
                value={formData.name} 
                onChange={e => setFormData({ ...formData, name: e.target.value })} 
                placeholder="Your full name"
              />
            </div>
            <div className="space-y-2">
              <Label>Profession / Title</Label>
              <Input 
                value={formData.profession} 
                onChange={e => setFormData({ ...formData, profession: e.target.value })} 
                placeholder="e.g. Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input 
                value={formData.location} 
                onChange={e => setFormData({ ...formData, location: e.target.value })} 
                placeholder="e.g. San Francisco, CA"
              />
            </div>
            <div className="space-y-2">
              <Label>Short Bio</Label>
              <Input 
                value={formData.shortBio} 
                onChange={e => setFormData({ ...formData, shortBio: e.target.value })} 
                placeholder="A one-line summary..."
              />
            </div>
            <div className="space-y-2">
              <Label>About You</Label>
              <Textarea 
                value={formData.longBio} 
                onChange={e => setFormData({ ...formData, longBio: e.target.value })} 
                placeholder="Tell us about your experience and background..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Profile Image URL</Label>
              <Input 
                value={formData.profilePhoto} 
                onChange={e => setFormData({ ...formData, profilePhoto: e.target.value })} 
                placeholder="https://example.com/me.jpg"
              />
            </div>
            <div className="space-y-2">
              <Label>Cover Image URL</Label>
              <Input 
                value={formData.bannerPhoto} 
                onChange={e => setFormData({ ...formData, bannerPhoto: e.target.value })} 
                placeholder="https://example.com/cover.jpg"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <MobileNav />
    </AppLayout>
  );
}
