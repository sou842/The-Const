"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import useSWR from "swr";
import { getter } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

const MAX_COMMENT_LENGTH = 500;

interface Author {
  _id: string;
  name: string;
  profilePhoto?: string;
  username?: string;
}

interface CommentItem {
  _id: string;
  content: string;
  createdAt: string;
  authorId?: Author;
}

interface BlogEngagementProps {
  blogId: string;
  blogUrl: string; // Added to enable view tracking via URL
  initialLikeCount: number;
  initialIsLiked: boolean;
}

export const BlogEngagement = ({ blogId, blogUrl, initialLikeCount, initialIsLiked }: BlogEngagementProps) => {
  const { user } = useAuth();
  const commentFormRef = useRef<HTMLTextAreaElement>(null);

  const [liked, setLiked] = useState(initialIsLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [commentContent, setCommentContent] = useState("");

  // Tracking views client-side to keep the main page static/cacheable
  useEffect(() => {
    if (blogUrl) {
      fetch(`/api/blogs/${blogUrl}/view`, { method: "POST" }).catch(console.error);
    }
  }, [blogUrl]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch the REAL like status client-side.
  // Server components can't read auth cookies, so `initialIsLiked` from SSR is
  // always false. This SWR call runs after hydration with the user's real cookie
  // and gives us the accurate liked state + count.
  const { data: likeData } = useSWR(
    user ? `/api/blogs/${blogId}/like` : null,
    getter,
    { revalidateOnFocus: false }
  );

  // Sync liked state once the client-side fetch resolves
  useEffect(() => {
    if (likeData !== undefined) {
      setLiked(likeData.isLiked ?? false);
      setLikeCount(likeData.likeCount ?? initialLikeCount);
    }
  }, [likeData, initialLikeCount]);

  // Fetch comments — oldest first (conversation flow)
  const { data, mutate, isLoading } = useSWR(
    `/api/blogs/${blogId}/comments?page=1&limit=50`,
    getter
  );
  const comments: CommentItem[] = data?.comments || [];
  const totalCommentCount = data?.totalCount ?? 0;

  const handleLike = async () => {
    if (!user) {
      toast.error("Please log in to like this post");
      return;
    }

    // Optimistic update
    const prevLiked = liked;
    const prevCount = likeCount;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCount((c) => Math.max(0, newLiked ? c + 1 : c - 1));

    try {
      const res = await fetch(`/api/blogs/${blogId}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");

      // Sync with server-returned state
      const data = await res.json();
      setLiked(data.isLiked);
      setLikeCount(data.likeCount);
    } catch {
      // Revert on failure
      setLiked(prevLiked);
      setLikeCount(prevCount);
      toast.error("Failed to update like");
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to comment.");
      return;
    }
    const trimmed = commentContent.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_COMMENT_LENGTH) {
      toast.error(`Comment must be ${MAX_COMMENT_LENGTH} characters or fewer`);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/blogs/${blogId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to post comment");
      }

      toast.success("Comment posted!");
      setCommentContent("");
      mutate(); // Re-fetch the comments list
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const charsRemaining = MAX_COMMENT_LENGTH - commentContent.length;

  return (
    <div className="mt-8 border-t pt-6" id="comments">
      {/* Stats Bar */}
      <div className="flex items-center gap-3 mb-8 pb-6 border-b">
        <button
          onClick={handleLike}
          className={cn(
            "flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border transition-all duration-200 active:scale-95 cursor-pointer",
            liked
              ? "border-rose-400/50 bg-rose-500/10 text-rose-500 hover:bg-rose-500/15"
              : "border-border text-muted-foreground hover:border-rose-400/50 hover:text-rose-500 hover:bg-rose-500/5"
          )}
        >
          <Heart
            className={cn(
              "h-4 w-4 transition-all duration-200",
              liked && "fill-rose-500 scale-110"
            )}
          />
          <span className="font-semibold tabular-nums">{likeCount}</span>
          <span className="hidden sm:inline font-medium">{liked ? "Liked" : "Like"}</span>
        </button>

        <button
          onClick={() => commentFormRef.current?.focus()}
          className="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-full border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-primary/5 transition-all duration-200 active:scale-95 cursor-pointer"
        >
          <MessageCircle className="h-4 w-4" />
          <span className="font-semibold tabular-nums">{totalCommentCount}</span>
          <span className="hidden sm:inline">{totalCommentCount === 1 ? "Comment" : "Comments"}</span>
        </button>
      </div>

      {/* Discussion Section */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold tracking-tight">Discussion</h3>

        {/* Comment Form */}
        {user ? (
          <form onSubmit={handlePostComment} className="flex gap-3 items-start">
            <Avatar className="h-9 w-9 mt-1 shrink-0">
              <AvatarImage src={user.profilePhoto} />
              <AvatarFallback>{user.name[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 border rounded-2xl bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary/30 focus-within:border-primary/50 transition-all">
              <textarea
                ref={commentFormRef}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
                placeholder="Share your thoughts..."
                className="w-full bg-transparent text-sm p-4 focus:outline-none resize-none min-h-[72px] max-h-48"
                rows={3}
                maxLength={MAX_COMMENT_LENGTH}
              />
              <div className="flex items-center justify-between px-4 pb-3">
                <span
                  className={cn(
                    "text-xs transition-colors",
                    charsRemaining < 50 ? "text-destructive font-medium" : "text-muted-foreground"
                  )}
                >
                  {charsRemaining} remaining
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={!commentContent.trim() || isSubmitting || charsRemaining < 0}
                  className="gap-2 h-8 px-4"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                  Post
                </Button>
              </div>
            </div>
          </form>
        ) : (
          <div className="p-5 border border-dashed rounded-2xl bg-muted/30 text-center">
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log in
              </Link>{" "}
              to join the discussion
            </p>
          </div>
        )}

        {/* Comments List */}
        <div className="space-y-4 mt-2">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length > 0 ? (
            comments.map((comment) => {
              const name = comment.authorId?.name || "Unknown";
              const initials = name[0]?.toUpperCase() ?? "?";
              return (
                <div key={comment._id} className="flex gap-3 animate-fade-in">
                  <Avatar className="h-8 w-8 mt-0.5 shrink-0">
                    <AvatarImage src={comment.authorId?.profilePhoto} />
                    <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-muted/40 border rounded-2xl px-4 py-3">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-semibold text-sm">{name}</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap overflow-wrap-anywhere">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10">
              <MessageCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No comments yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
