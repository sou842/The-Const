import { notFound } from "next/navigation";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { EditorJsRenderer } from "@/components/blog/EditorJsRenderer";
import type { BlogPost, EditorBlock } from "@/types/blog";

import { BlogEngagement } from "@/components/blog/BlogEngagement";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import { Like } from "@/models/Like";
import { Comment } from "@/models/Comment";
import { getSession } from "@/lib/auth";
import mongoose from "mongoose";
import { cache } from "react";
import { ThumbnailGallery } from "@/components/blog/ThumbnailGallery";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      authorId: blogDoc.authorId // Ensure authorId is available for permission check
    };
  } catch (err) {
    console.error("Direct fetch blog error:", err);
    return null;
  }
});

export default async function BlogReadPage({ params }: Props) {
  const { url } = await params;
  const blog = await getBlog(url);
  const session = await getSession().catch(() => null);

  if (!blog) notFound();

  const isAuthor = blog.authorId && session?.userId && String(blog.authorId) === String(session.userId);
  const isAdmin = session?.role === "admin";
  const canEdit = isAuthor || isAdmin;

  return (
    <AppLayout shadow="none">
      <div className="pb-20 md:pb-8 animate-fade-in max-w-4xl mx-auto px-4">
        {/* Edit Button for Author/Admin */}
        {canEdit && (
          <div className="flex justify-end mb-4">
            <Button asChild variant="outline" size="sm" className="gap-2 border-primary/20 hover:border-primary/50 hover:bg-primary/5">
              <Link href={`/write?url=${blog.url}`}>
                <PenLine className="h-4 w-4" />
                Edit Post
              </Link>
            </Button>
          </div>
        )}

        {/* Thumbnails (Image, Gallery, or Video with Lightbox) */}
        <ThumbnailGallery thumbnail={blog.thumbnail || { type: 'image', image: blog.image }} title={blog.title} />

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-8 text-foreground">
          {blog.title}
        </h1>

        <article className="mb-8">
          {blog.body && (blog.body as EditorBlock[]).map((block: EditorBlock, index: number) => (
            <EditorJsRenderer key={index} block={block} isFirst={index === 0} />
          ))}
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

  // Determine the best share image
  let shareImage = blog.thumbnail?.url || blog.thumbnail?.image || blog.image;
  if (blog.thumbnail?.type === "multiple-images" && blog.thumbnail.urls?.length) {
    shareImage = blog.thumbnail.urls[0];
  }

  return {
    title: `${blog.title} — The Const`,
    description: blog.thumbnail?.description || blog.title,
    openGraph: {
      title: blog.title,
      description: blog.thumbnail?.description || blog.title,
      type: "article",
      url: `https://theconst.com/blog/${url}`,
      images: shareImage ? [{ url: shareImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: blog.title,
      description: blog.thumbnail?.description || blog.title,
      images: shareImage ? [shareImage] : [],
    },
  };
}
