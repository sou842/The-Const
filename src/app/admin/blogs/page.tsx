"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Loader2, ShieldCheck } from "lucide-react";
import type { BlogPost } from "@/types/blog";

import { getter, putter } from "@/lib/api";

export default function AdminBlogsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [fetching, setFetching] = useState(true);
  const [activeStatus, setActiveStatus] = useState("pending");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.push("/");
    }
  }, [user, loading, router]);

  const fetchBlogs = async (status: string) => {
    setFetching(true);
    try {
      const data = await getter(`/api/admin/blogs?status=${status}`);
      setBlogs(data.blogs || []);
    } catch (error) {
      console.error("Fetch blogs error:", error);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") fetchBlogs(activeStatus);
  }, [activeStatus, user]);

  const updateStatus = async (blogId: string, status: "approved" | "rejected") => {
    setActionLoading(blogId);
    try {
      await putter(`/api/admin/blogs/${blogId}`, { status });
      toast.success(`Blog ${status} successfully`);
      fetchBlogs(activeStatus);
    } catch (error) {
      console.error("Update status error:", error);
    } finally {
      setActionLoading(null);
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (user.role !== "admin") return null;

  return (
    <div className="pb-8">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-bold">Blog Moderation</h1>
      </div>

      <Tabs value={activeStatus} onValueChange={setActiveStatus}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" /> Pending
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <CheckCircle className="h-4 w-4" /> Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <XCircle className="h-4 w-4" /> Rejected
          </TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected"].map((status) => (
          <TabsContent key={status} value={status}>
            {fetching ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-dashed">
                <p className="text-muted-foreground text-sm">No {status} blogs.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blogs.map((blog) => (
                  <div
                    key={blog._id}
                    className="bg-card rounded-xl border p-5 space-y-3 animate-fade-in"
                  >
                    {/* Blog thumbnail */}
                    {blog.thumbnail?.image && (
                      <img
                        src={blog.thumbnail.image}
                        alt={blog.title}
                        className="w-full h-40 object-cover rounded-lg border"
                      />
                    )}

                    {/* Title & Category */}
                    <div className="flex items-start justify-between gap-2">
                      <h2 className="font-display font-semibold text-lg leading-tight">{blog.title}</h2>
                      <Badge variant="outline" className="shrink-0">{blog.category}</Badge>
                    </div>

                    {/* Author */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {blog.author ? blog.author.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2) : "AU"}
                        </AvatarFallback>
                      </Avatar>
                      <span>{blog.author}</span>
                      <span>.</span>
                      <span>{blog.createdAt ? new Date(blog.createdAt).toLocaleDateString() : "No date"}</span>
                    </div>

                    {/* Tags */}
                    {blog.tags && blog.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {blog.tags.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="text-xs">#{tag}</Badge>
                        ))}
                      </div>
                    )}


                    <Separator />

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        asChild
                      >
                        <a href={`/blog/${blog.url}`} target="_blank" rel="noopener noreferrer">
                          Preview
                        </a>
                      </Button>

                      {status !== "approved" && (
                        <Button
                          size="sm"
                          className="gap-1.5 text-xs bg-green-600 hover:bg-green-700"
                          onClick={() => updateStatus(blog._id, "approved")}
                          disabled={actionLoading === blog._id}
                        >
                          {actionLoading === blog._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <CheckCircle className="h-3.5 w-3.5" />
                          )}
                          Approve
                        </Button>
                      )}

                      {status !== "rejected" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5 text-xs"
                          onClick={() => updateStatus(blog._id, "rejected")}
                          disabled={actionLoading === blog._id}
                        >
                          {actionLoading === blog._id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5" />
                          )}
                          Reject
                        </Button>
                      )}

                      {status !== "pending" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs"
                          onClick={() => updateStatus(blog._id, "pending" as any)}
                          disabled={actionLoading === blog._id}
                        >
                          Move to Pending
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
