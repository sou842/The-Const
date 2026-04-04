import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye, ArrowUpRight } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useSaved } from "@/contexts/SavedContext";
import { toast } from "sonner";
import type { BlogPost } from "@/types/blog";

interface PostCardProps {
  _id?: string;
  author: string | { _id?: string; name: string; avatar?: string; title?: string; initials?: string };
  content?: string;
  body?: any[];
  thumbnail?: { image?: string; title?: string; description?: string };
  image?: string;
  time?: string;
  createdAt?: string | Date;
  publishedDate?: string | Date;
  likeCount?: number;
  isLikedByUser?: boolean;
  commentCount?: number;
  views?: number;
  category?: string;
  title?: string;
  url?: string;
  status?: "approved" | "pending" | "rejected";
  onStatusUpdate?: (status: "approved" | "pending" | "rejected") => void;
  creator?: {
    _id?: string;
    name?: string;
    profilePhoto?: string;
    profession?: string;
  };
  isSaved?: boolean;
}

export const PostCard = (props: PostCardProps) => {
  const {
    _id,
    author,
    content,
    title,
    body,
    thumbnail,
    image,
    time,
    createdAt,
    likeCount = 0,
    isLikedByUser = false,
    commentCount = 0,
    views,
    category,
    url,
    status,
    onStatusUpdate,
    creator,
  } = props;

  const router = useRouter();
  const { user } = useAuth();
  const { isSaved: checkIsSaved, toggleSave } = useSaved();

  // State management
  const [liked, setLiked] = useState(isLikedByUser);
  const [likeCountState, setLikeCountState] = useState(likeCount);
  const isBookmarked = _id ? checkIsSaved(_id) : false;

  // Refs for debouncing and tracking
  const likeDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const saveDebounceTimer = useRef<NodeJS.Timeout | null>(null);
  const likeAbortController = useRef<AbortController | null>(null);
  const saveAbortController = useRef<AbortController | null>(null);

  // Track the ACTUAL intended final state (last user action)
  const intendedLikeState = useRef<boolean>(isLikedByUser);
  const lastActionTimestamp = useRef<number>(0);

  // Sync with props
  useEffect(() => {
    setLiked(isLikedByUser);
    setLikeCountState(likeCount);
    intendedLikeState.current = isLikedByUser;
  }, [isLikedByUser, likeCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (likeDebounceTimer.current) {
        clearTimeout(likeDebounceTimer.current);
      }
      if (saveDebounceTimer.current) {
        clearTimeout(saveDebounceTimer.current);
      }
      if (likeAbortController.current) {
        likeAbortController.current.abort();
      }
      if (saveAbortController.current) {
        saveAbortController.current.abort();
      }
    };
  }, []);

  const handleCardClick = useCallback(() => {
    if (url) {
      router.push(`/blog/${url}`);
    }
  }, [url, router]);

  /**
   * Improved debounced like handler with guaranteed last-action sync
   * 
   * Key improvements:
   * 1. Tracks the INTENDED final state (what user wants)
   * 2. After API call, ensures UI matches the intended state
   * 3. Handles rapid clicks correctly
   */
  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Auth check
    if (!user) {
      toast.error("Please log in to like a post");
      return;
    }

    if (!_id) {
      console.warn("PostCard: Cannot like post without _id");
      return;
    }

    // Record this action timestamp
    const actionTimestamp = Date.now();
    lastActionTimestamp.current = actionTimestamp;

    // Calculate new intended state
    const newLiked = !liked;
    intendedLikeState.current = newLiked;

    // Immediate optimistic UI update
    setLiked(newLiked);
    setLikeCountState((prev) => Math.max(0, newLiked ? prev + 1 : prev - 1));

    // Clear existing timer and abort pending request
    if (likeDebounceTimer.current) {
      clearTimeout(likeDebounceTimer.current);
    }
    if (likeAbortController.current) {
      likeAbortController.current.abort();
    }

    // Create new abort controller
    likeAbortController.current = new AbortController();
    const currentAbortController = likeAbortController.current;

    // Debounce the API call
    likeDebounceTimer.current = setTimeout(async () => {
      // Double-check this is still the latest action
      if (actionTimestamp < lastActionTimestamp.current) {
        // A newer action came in, let that one handle the API call
        return;
      }

      try {
        const res = await fetch(`/api/blogs/${_id}/like`, {
          method: "POST",
          signal: currentAbortController.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!res.ok) {
          console.error("like active failed")
        }

        const data = await res.json();

        // Only update if we haven't been aborted
        if (!currentAbortController.signal.aborted) {
          // CRITICAL FIX: Check if server state matches our intended state
          // If not, make another call to sync
          if (data.isLiked !== intendedLikeState.current) {
            console.log('Server state mismatch, syncing...', {
              server: data.isLiked,
              intended: intendedLikeState.current
            });

            // Make immediate sync call
            try {
              const syncRes = await fetch(`/api/blogs/${_id}/like`, {
                method: "POST",
                signal: currentAbortController.signal,
                headers: {
                  "Content-Type": "application/json",
                },
              });

              if (syncRes.ok) {
                const syncData = await syncRes.json();
                setLiked(syncData.isLiked);
                setLikeCountState(syncData.likeCount);
              } else {
                // If sync fails, at least update to intended state locally
                setLiked(intendedLikeState.current);
                setLikeCountState((prev) => 
                  Math.max(0, intendedLikeState.current ? prev + 1 : prev - 1)
                );
              }
            } catch (syncError: any) {
              if (syncError.name !== "AbortError") {
                console.error("Sync failed:", syncError);
                // Update to intended state locally
                setLiked(intendedLikeState.current);
                setLikeCountState((prev) => 
                  Math.max(0, intendedLikeState.current ? prev + 1 : prev - 1)
                );
              }
            }
          } else {
            // Server matches intended state, update normally
            setLiked(data.isLiked);
            setLikeCountState(data.likeCount);
          }
        }
      } catch (error: any) {
        // Don't show error for aborted requests
        if (error.name === "AbortError") {
          return;
        }

        console.error("Failed to update like:", error);

        // Revert to previous state only if not aborted
        if (!currentAbortController.signal.aborted) {
          // Instead of reverting, try to maintain intended state
          setLiked(intendedLikeState.current);
          toast.error("Failed to update like. Please try again.");
        }
      }
    }, 500); // 500ms debounce
  }, [user, _id, liked]);

  /**
   * Debounced save handler
   * - Immediate UI feedback via context
   * - API call debounced by 300ms
   */
  const handleSave = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!_id) {
      console.warn("PostCard: Cannot save post without _id");
      return;
    }

    if (!user) {
      toast.error("Please log in to save posts");
      return;
    }

    // Clear existing timer and abort pending request
    if (saveDebounceTimer.current) {
      clearTimeout(saveDebounceTimer.current);
    }
    if (saveAbortController.current) {
      saveAbortController.current.abort();
    }

    // Create new abort controller
    saveAbortController.current = new AbortController();

    // Debounce the save operation
    saveDebounceTimer.current = setTimeout(async () => {
      try {
        // toggleSave should handle optimistic updates and API calls
        await toggleSave(props as unknown as BlogPost);
      } catch (error: any) {
        // Don't show error for aborted requests
        if (error.name === "AbortError") {
          return;
        }
        console.error("Failed to save post:", error);
        // toggleSave should handle its own error states
      }
    }, 300); // 300ms debounce
  }, [_id, user, toggleSave, props]);

  /**
   * Share handler with clipboard fallback
   */
  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const shareUrl = url 
      ? `${window.location.origin}/blog/${url}` 
      : window.location.href;

    try {
      // Try modern share API first (mobile friendly)
      if (navigator.share && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        await navigator.share({
          title: title || "Blog Post",
          url: shareUrl,
        });
        return;
      }

      // Fallback to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch (error: any) {
      // User cancelled share or clipboard failed
      if (error.name !== "AbortError") {
        console.error("Share failed:", error);
        toast.error("Could not share link");
      }
    }
  }, [url, title]);

  // Safe author data extraction
  const authorName = typeof author === "string" ? author : author?.name || "Anonymous";
  const authorAvatar = typeof author === "object" ? author?.avatar : creator?.profilePhoto;
  const authorTitle = typeof author === "object" ? author?.title : creator?.profession;
  const authorId = creator?._id || (typeof author === "object" && "_id" in author ? author._id : undefined);

  const authorInitials =
    (typeof author === "object" ? author?.initials : undefined) ??
    authorName
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) ??
    "AU";

  /**
   * Extract preview text from body structure
   */
  const getBodyPreview = useCallback(() => {
    if (content) return content;
    if (!body || !Array.isArray(body)) return "";

    try {
      const para = (body as Array<{ type: string; data: { text?: string } }>).find(
        (b) => b.type === "paragraph"
      );
      return para?.data?.text?.replace(/<[^>]+>/g, "") ?? "";
    } catch (error) {
      console.error("Error parsing body preview:", error);
      return "";
    }
  }, [content, body]);

  const preview = getBodyPreview();
  const coverImage = thumbnail?.image || image;
  const displayTime = time ?? (createdAt
    ? (() => {
        try {
          return new Date(createdAt).toLocaleDateString("en-US", { 
            month: "short", 
            day: "numeric" 
          });
        } catch {
          return "";
        }
      })()
    : "");

  return (
    <article 
      onClick={handleCardClick}
      className="group relative cursor-pointer mb-6"
      aria-label={title || "Blog post"}
      role="article"
    >
      {/* Decorative accent line */}
      <div 
        className="absolute -left-px top-6 bottom-6 w-[2px] bg-linear-to-b from-transparent via-foreground/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
        aria-hidden="true"
      />

      <div className="relative bg-card border border-border/50 rounded-[20px] overflow-hidden transition-all duration-500 group-hover:border-foreground/15 group-hover:shadow-[0_20px_60px_-20px_hsl(var(--foreground)/0.1)]">
        {/* Image — full bleed with overlay gradient */}
        {coverImage && (
          <div className="relative h-64 overflow-hidden">
            <img
              src={coverImage}
              alt={title || "Blog post cover image"}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                // Hide image on error
                e.currentTarget.style.display = "none";
              }}
            />
            {/* Floating time badge on image */}
            {displayTime && (
              <span className="absolute top-4 right-4 text-xs font-medium tracking-wider uppercase bg-card/80 backdrop-blur-md text-muted-foreground px-3 py-1.5 rounded-full border border-border/30">
                {displayTime}
              </span>
            )}
          </div>
        )}

        <div className={cn("px-6 pb-5", coverImage ? "pt-4 relative z-10" : "pt-6")}>
          {/* Author row */}
          <div className="flex items-start gap-3.5">
            <div className="relative shrink-0">
              {authorId ? (
                <Link 
                  href={`/profile/${authorId}`} 
                  className="shrink-0 block" 
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`View ${authorName}'s profile`}
                >
                  <Avatar className="h-10 w-10 ring-[1.5px] ring-border shadow-sm">
                    <AvatarImage src={authorAvatar} alt={authorName} />
                    <AvatarFallback className="text-[11px] font-semibold bg-muted">
                      {authorInitials}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="h-10 w-10 ring-[1.5px] ring-border shadow-sm">
                  <AvatarImage src={authorAvatar} alt={authorName} />
                  <AvatarFallback className="text-[11px] font-semibold bg-muted">
                    {authorInitials}
                  </AvatarFallback>
                </Avatar>
              )}
            </div>
            
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                {authorId ? (
                  <Link 
                    href={`/profile/${authorId}`} 
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline"
                  >
                    <p className="font-semibold text-sm tracking-tight">{authorName}</p>
                  </Link>
                ) : (
                  <p className="font-semibold text-sm tracking-tight">{authorName}</p>
                )}
                <ArrowUpRight className="h-3 w-3 text-muted-foreground/40" aria-hidden="true" />
                
                {status && status !== "approved" && (
                  <Badge 
                    variant={status === "pending" ? "outline" : "destructive"} 
                    className="text-xs px-1.5 h-4 capitalize ml-1"
                  >
                    {status}
                  </Badge>
                )}
                {status === "pending" && onStatusUpdate && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="h-5 text-xs px-1.5 bg-primary/10 text-primary hover:bg-primary/20 border-none ml-1"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      onStatusUpdate("approved");
                    }}
                  >
                    Approve
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground/70 font-medium mt-0.5">
                {authorTitle || "Member"}
              </p>
            </div>

            {!coverImage && displayTime && (
              <span className="text-xs text-muted-foreground/50 font-normal tracking-wider uppercase shrink-0 pt-2">
                {displayTime}
              </span>
            )}
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8 rounded-full text-muted-foreground/40 hover:text-foreground transition-all duration-300" 
              onClick={(e) => { 
                e.preventDefault(); 
                e.stopPropagation(); 
              }}
              aria-label="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="mt-4 space-y-2">
            {thumbnail?.title && (
              <p className="text-sm leading-[1.6] text-foreground/80 font-light">
                {thumbnail.title}
              </p>
            )}
            {thumbnail?.description && (
              <p className="text-sm leading-[1.6] text-foreground/80 line-clamp-3 font-light">
                {thumbnail.description}
              </p>
            )}
          </div>

          {/* Engagement bar */}
          <div className="mt-5 flex items-center justify-between">
            <div className="flex items-center">
              <button
                className={cn(
                  "px-2 flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors duration-300 group/like",
                  liked && "text-destructive hover:text-destructive"
                )}
                onClick={handleLike}
                aria-label={liked ? "Unlike post" : "Like post"}
                aria-pressed={liked}
              >
                <Heart 
                  className={cn(
                    "h-[16px] w-[16px] transition-all duration-300",
                    liked && "fill-destructive scale-110"
                  )} 
                />
                <span className="text-[12px] font-medium tabular-nums">
                  {likeCountState}
                </span>
              </button>

              <Link 
                href={url ? `/blog/${url}#comments` : "#"} 
                className="px-2 flex items-center gap-1.5 text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
                onClick={(e) => e.stopPropagation()}
                aria-label={`View ${commentCount} comments`}
              >
                <MessageCircle className="h-[16px] w-[16px]" />
                <span className="text-[12px] font-medium tabular-nums">{commentCount}</span>
              </Link>

              <button 
                className="px-2 text-muted-foreground/60 hover:text-foreground transition-colors duration-300"
                onClick={handleShare}
                aria-label="Share post"
              >
                <Share2 className="h-[16px] w-[16px]" />
              </button>
            </div>

            <button
              className={cn(
                "text-muted-foreground/40 hover:text-foreground transition-all duration-300",
                isBookmarked && "text-primary"
              )}
              onClick={handleSave}
              aria-label={isBookmarked ? "Remove bookmark" : "Bookmark post"}
              aria-pressed={isBookmarked}
            >
              <Bookmark 
                className={cn(
                  "h-[16px] w-[16px] transition-all duration-300", 
                  isBookmarked && "fill-primary"
                )} 
              />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};