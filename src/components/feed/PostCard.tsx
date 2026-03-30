"use client";

import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PostCardProps {
  _id?: string;
  author: string | { _id?: string; name: string; avatar?: string; title?: string; initials?: string };
  content?: string;
  body?: object[];
  thumbnail?: { image?: string; title?: string };
  image?: string;
  time?: string;
  createdAt?: string;
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
    isSaved = false,
  } = props;

  const { user } = useAuth();

  // Sync liked/likeCount state when props change (e.g., parent SWR refetch)
  const [liked, setLiked] = useState(isLikedByUser);
  const [saved, setSaved] = useState(isSaved);
  const [likeCountState, setLikeCountState] = useState(likeCount);

  useEffect(() => {
    setLiked(isLikedByUser);
    setLikeCountState(likeCount);
  }, [isLikedByUser, likeCount]);

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please log in to like a post");
      return;
    }
    if (!props._id) return;

    // Optimistic update
    const prevLiked = liked;
    const prevCount = likeCountState;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCountState((c) => Math.max(0, newLiked ? c + 1 : c - 1));

    try {
      const res = await fetch(`/api/blogs/${props._id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");

      // Sync with server-returned counts
      const data = await res.json();
      setLiked(data.isLiked);
      setLikeCountState(data.likeCount);
    } catch {
      // Revert on failure
      setLiked(prevLiked);
      setLikeCountState(prevCount);
      toast.error("Failed to update like");
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newSaved = !saved;
    setSaved(newSaved);

    if (props._id) {
      try {
        await fetch("/api/saved", {
          method: newSaved ? "POST" : "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ blogId: props._id }),
        });
      } catch {
        setSaved(!newSaved);
        toast.error("Failed to save post");
      }
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = url ? `${window.location.origin}/blog/${url}` : window.location.href;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link");
    }
  };

  const authorName = typeof author === "string" ? author : author?.name;
  const authorAvatar = typeof author === "object" ? author?.avatar : creator?.profilePhoto;
  const authorTitle = typeof author === "object" ? author?.title : creator?.profession;
  const authorId = creator?._id || (typeof author === "object" && "_id" in author ? author._id : undefined);

  const authorInitials =
    (typeof author === "object" ? author?.initials : undefined) ??
    authorName?.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) ??
    "AU";

  const getBodyPreview = () => {
    if (content) return content;
    if (!body || !Array.isArray(body)) return "";
    const para = (body as Array<{ type: string; data: { text?: string } }>).find(
      (b) => b.type === "paragraph"
    );
    return para?.data?.text?.replace(/<[^>]+>/g, "") ?? "";
  };

  const preview = getBodyPreview();
  const coverImage = thumbnail?.image || image;
  const displayTime = time ?? (createdAt
    ? new Date(createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "");

  const cardContent = (
    <article className="bg-card rounded-xl border p-4 animate-fade-in hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        {authorId ? (
          <Link href={`/profile/${authorId}`} className="hidden sm:block shrink-0" onClick={(e) => e.stopPropagation()}>
            <Avatar className="h-10 w-10">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
          </Link>
        ) : (
          <Avatar className="hidden sm:block h-10 w-10 shrink-0">
            <AvatarImage src={authorAvatar} />
            <AvatarFallback>{authorInitials}</AvatarFallback>
          </Avatar>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {authorId ? (
                <Link href={`/profile/${authorId}`} className="block sm:hidden shrink-0" onClick={(e) => e.stopPropagation()}>
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={authorAvatar} />
                    <AvatarFallback>{authorInitials}</AvatarFallback>
                  </Avatar>
                </Link>
              ) : (
                <Avatar className="block sm:hidden h-10 w-10 shrink-0">
                  <AvatarImage src={authorAvatar} />
                  <AvatarFallback>{authorInitials}</AvatarFallback>
                </Avatar>
              )}
              {authorId ? (
                <Link href={`/profile/${authorId}`} className="hover:underline" onClick={(e) => e.stopPropagation()}>
                  <div>
                    <p className="font-semibold text-sm">{authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {authorTitle ? `${authorTitle} · ` : ""}{displayTime}
                    </p>
                  </div>
                </Link>
              ) : (
                <div>
                  <p className="font-semibold text-sm">{authorName}</p>
                  <p className="text-xs text-muted-foreground">
                    {authorTitle ? `${authorTitle} · ` : ""}{displayTime}
                  </p>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              {status && status !== "approved" && (
                <Badge variant={status === "pending" ? "outline" : "destructive"} className="text-[10px] px-1.5 h-5 capitalize">
                  {status}
                </Badge>
              )}
              {status === "pending" && onStatusUpdate && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 text-[10px] px-2 bg-primary/10 text-primary hover:bg-primary/20 border-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onStatusUpdate("approved");
                  }}
                >
                  Approve
                </Button>
              )}
              {category && <Badge variant="outline" className="text-xs hidden sm:flex">{category}</Badge>}
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {title && (
            <p className="mt-3 text-base font-semibold line-clamp-3">{title}</p>
          )}

          {preview && (
            <p className="mt-3 text-sm leading-relaxed line-clamp-3 text-muted-foreground">{preview}</p>
          )}

          {coverImage && (
            <div className="mt-3 rounded-lg overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt={title || ""} className="w-full h-56 object-cover" />
            </div>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <div className="flex items-center gap-1">
              {/* Like Button */}
              <Button
                variant="ghost"
                size="sm"
                className={cn("h-8 gap-1.5 px-2 transition-colors hover:bg-transparent", liked && "text-rose-500 hover:text-rose-600")}
                onClick={handleLike}
              >
                <Heart className={cn("h-4 w-4 transition-all", liked && "fill-rose-500 scale-110")} />
                <span className="text-xs">{likeCountState}</span>
              </Button>

              {/* Comment Button — links to blog#comments */}
              <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 hover:bg-transparent" asChild>
                <Link href={url ? `/blog/${url}#comments` : "#"} onClick={(e) => e.stopPropagation()}>
                  <MessageCircle className="h-4 w-4" />
                  <span className="text-xs">{commentCount}</span>
                </Link>
              </Button>

              {/* Share Button */}
              <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-transparent" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>

              {views !== undefined && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground px-2">
                  <Eye className="h-3.5 w-3.5" /> {views}
                </span>
              )}
            </div>

            {/* Bookmark Button */}
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={handleSave}>
              <Bookmark className={cn("h-4 w-4", saved && "fill-foreground")} />
            </Button>
          </div>
        </div>
      </div>
    </article>
  );

  return url ? (
    <Link href={`/blog/${url}`} className="block">
      {cardContent}
    </Link>
  ) : (
    cardContent
  );
};
