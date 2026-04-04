"use client";

import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, Eye } from "lucide-react";
import { useState, useEffect } from "react";
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

  const [liked, setLiked] = useState(isLikedByUser);
  const [likeCountState, setLikeCountState] = useState(likeCount);
  const isBookmarked = _id ? checkIsSaved(_id) : false;

  useEffect(() => {
    setLiked(isLikedByUser);
    setLikeCountState(likeCount);
  }, [isLikedByUser, likeCount]);

  const handleCardClick = () => {
    if (url) {
      router.push(`/blog/${url}`);
    }
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please log in to like a post");
      return;
    }
    if (!_id) return;

    const prevLiked = liked;
    const prevCount = likeCountState;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikeCountState((c) => Math.max(0, newLiked ? c + 1 : c - 1));

    try {
      const res = await fetch(`/api/blogs/${_id}/like`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setLiked(data.isLiked);
      setLikeCountState(data.likeCount);
    } catch {
      setLiked(prevLiked);
      setLikeCountState(prevCount);
      toast.error("Failed to update like");
    }
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (_id) {
        // Pass the whole post object for IDB storage
        await toggleSave(props as unknown as BlogPost);
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

  return (
    <article 
      onClick={handleCardClick}
      className="bg-card rounded-2xl border p-5 transition-all duration-300 animate-fade-in hover:shadow-[0_8px_30px_-12px_hsl(var(--foreground)/0.08)] hover:border-foreground/10 group cursor-pointer mb-6"
    >
      {/* Author header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          {authorId ? (
            <Link href={`/profile/${authorId}`} className="shrink-0 z-10" onClick={(e) => e.stopPropagation()}>
              <Avatar className="h-11 w-11 ring-2 ring-border">
                <AvatarImage src={authorAvatar} />
                <AvatarFallback className="text-xs font-semibold">{authorInitials}</AvatarFallback>
              </Avatar>
            </Link>
          ) : (
            <Avatar className="h-11 w-11 ring-2 ring-border">
              <AvatarImage src={authorAvatar} />
              <AvatarFallback className="text-xs font-semibold">{authorInitials}</AvatarFallback>
            </Avatar>
          )}
          {/* Status dot - showing as online for demo if it's an author post */}
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-online border-2 border-card" />
        </div>
        
        <div className="flex-1 min-w-0">
          {authorId ? (
            <Link href={`/profile/${authorId}`} className="hover:underline z-10" onClick={(e) => e.stopPropagation()}>
              <p className="font-semibold text-sm leading-tight">{authorName}</p>
            </Link>
          ) : (
            <p className="font-semibold text-sm leading-tight">{authorName}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {authorTitle || "Member"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {status && status !== "approved" && (
            <Badge variant={status === "pending" ? "outline" : "destructive"} className="text-[10px] px-1.5 h-5 capitalize">
              {status}
            </Badge>
          )}
          {status === "pending" && onStatusUpdate && (
            <Button
              size="sm"
              variant="secondary"
              className="h-7 text-[10px] px-2 bg-primary/10 text-primary hover:bg-primary/20 border-none z-10"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onStatusUpdate("approved");
              }}
            >
              Approve
            </Button>
          )}
          <p className="text-[10px] text-muted-foreground/60 font-medium">{displayTime}</p>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3">
        {title && (
          <p className="text-sm leading-relaxed text-foreground/90">{title}</p>
        )}
        {preview && (
          <p className="text-sm leading-relaxed text-foreground/90 line-clamp-3">{preview}</p>
        )}
      </div>

      {/* Image */}
      {coverImage && (
        <div className="mt-4 rounded-xl overflow-x-hidden overflow-y-hidden border bg-muted relative h-72">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={coverImage} 
            alt={title || ""} 
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500" 
          />
        </div>
      )}

      {/* Engagement bar */}
      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-9 gap-1.5 px-3 rounded-full text-muted-foreground transition-all z-10",
              liked && "text-destructive bg-destructive/5 hover:bg-destructive/10 hover:text-destructive"
            )}
            onClick={handleLike}
          >
            <Heart className={cn("h-[18px] w-[18px] transition-transform", liked && "fill-destructive scale-110")} />
            <span className="text-xs font-medium">{likeCountState}</span>
          </Button>

          <Button variant="ghost" size="sm" className="h-9 gap-1.5 px-3 rounded-full text-muted-foreground z-10" asChild>
            <Link href={url ? `/blog/${url}#comments` : "#"} onClick={(e) => e.stopPropagation()}>
              <MessageCircle className="h-[18px] w-[18px]" />
              <span className="text-xs font-medium">{commentCount}</span>
            </Link>
          </Button>

          <Button variant="ghost" size="sm" className="h-9 px-3 rounded-full text-muted-foreground z-10" onClick={handleShare}>
            <Share2 className="h-[18px] w-[18px]" />
          </Button>

          {views !== undefined && (
            <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 px-2 font-medium">
              <Eye className="h-3.5 w-3.5" /> {views}
            </span>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-9 px-3 rounded-full text-muted-foreground transition-all z-10",
            isBookmarked && "text-primary bg-primary/5 hover:bg-primary/10"
          )}
          onClick={handleSave}
        >
          <Bookmark className={cn("h-[18px] w-[18px] transition-transform", isBookmarked && "fill-primary scale-110")} />
        </Button>
      </div>
    </article>
  );
};
