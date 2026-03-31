import { notFound } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { EditorJsRenderer } from "@/components/blog/EditorJsRenderer";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Eye } from "lucide-react";
import type { BlogPost } from "@/types/blog";
import { BlogEngagement } from "@/components/blog/BlogEngagement";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Like } from "@/models/Like";
import { Comment } from "@/models/Comment";
import { getSession } from "@/lib/auth";
import mongoose from "mongoose";
import { cache } from "react";

// Register models
void Like;
void Comment;

// ISR Configuration: Revalidate every hour
export const revalidate = 3600;

// Allow other dynamic URLs to be generated on-demand
export const dynamicParams = true;

interface Props {
  params: Promise<{ url: string }>;
}

export async function generateStaticParams() {
  try {
    await connectDB();
    const blogs = await Blog.find({ status: "approved" }).select("url").lean();
    return blogs.map((blog) => ({
      url: blog.url,
    }));
  } catch (err) {
    console.error("Error generating static params:", err);
    return [];
  }
}

const getBlog = cache(async (url: string): Promise<BlogPost | null> => {
  try {
    await connectDB();
    const session = await getSession().catch(() => null);

    // Find by URL slug (the pretty URL, not _id)
    const blogDoc = await Blog.findOne({ url, status: "approved" }).lean();
    if (!blogDoc) return null;

    const blogId = blogDoc._id as mongoose.Types.ObjectId;

    // Fetch like count and user's like status in parallel
    const [likeCount, commentCount, userLike] = await Promise.all([
      Like.countDocuments({ blogId }),
      Comment.countDocuments({ blogId }),
      session?.userId && mongoose.Types.ObjectId.isValid(session.userId)
        ? Like.findOne({ blogId, userId: new mongoose.Types.ObjectId(session.userId) }).lean()
        : null,
    ]);

    // Cast as BlogPost after adding computed fields
    return {
      ...(blogDoc as unknown as BlogPost),
      likeCount,
      commentCount,
      isLikedByUser: !!userLike,
    };
  } catch (err) {
    console.error("Direct fetch blog error:", err);
    return null;
  }
});

export default async function BlogReadPage({ params }: Props) {
  const { url } = await params;
  const blog = await getBlog(url);

  if (!blog) notFound();

  const authorInitials = blog.author
    ?.split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "AU";

  const formattedDate = blog.publishedDate
    ? new Date(blog.publishedDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <AppLayout>
      <div className="pb-20 md:pb-8 animate-fade-in">
        {/* Back */}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Feed
        </Link>

        {/* Cover Image */}
        {blog.thumbnail?.image && (
          <div className="rounded-xl overflow-hidden border mb-6 h-64 md:h-80">
            <img
              src={blog.thumbnail.image}
              alt={blog.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Category & Tags */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <Badge>{blog.category}</Badge>
          {blog.tags?.map((tag: string) => (
            <Badge key={tag} variant="outline">
              #{tag}
            </Badge>
          ))}
        </div>

        {/* Title */}
        <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight mb-4">
          {blog.title}
        </h1>

        {/* Author & Meta */}
        <div className="flex items-center justify-between mb-6 pb-6 border-b">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={
                typeof blog.authorId === "object" && blog.authorId !== null
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  ? (blog.authorId as unknown as any).profilePhoto
                  : undefined
              } />
              <AvatarFallback>{authorInitials}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">{blog.author}</p>
              {formattedDate && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" /> {formattedDate}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" /> {blog.views ?? 0}
            </span>
          </div>
        </div>

        {/* Blog Content */}
        <article className="mb-8">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <EditorJsRenderer blocks={(blog.body as unknown as any[]) || []} />
        </article>

        {/* Engagement Footer & Comments */}
        <BlogEngagement
          blogId={String(blog._id)}
          blogUrl={blog.url}
          initialLikeCount={blog.likeCount ?? 0}
          initialIsLiked={blog.isLikedByUser ?? false}
        />
      </div>
      <MobileNav />
    </AppLayout>
  );
}

export async function generateMetadata({ params }: Props) {
  const { url } = await params;
  const blog = await getBlog(url);
  if (!blog) return { title: "Blog Not Found" };
  return {
    title: `${blog.title} — The Const`,
    description: blog.thumbnail?.description || blog.title,
    openGraph: {
      images: blog.thumbnail?.image ? [blog.thumbnail.image] : [],
    },
  };
}
