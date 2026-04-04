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

// Register models
void Like;
void Comment;

// ISR Configuration: Revalidate every hour
export const revalidate = 60 * 60;

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

  return (
    <AppLayout shadow="none">
      <div className="pb-20 md:pb-8 animate-fade-in max-w-4xl mx-auto px-4">
        {/* Thumbnails (Image, Gallery, or Video with Lightbox) */}
        <ThumbnailGallery thumbnail={blog.thumbnail || { type: 'image', image: blog.image }} title={blog.title} />

        {/* Title */}
        <h1 className="font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-8 text-foreground">
          {blog.title}
        </h1>

        {/* Author & Meta */}
        {/* <div className="flex items-center justify-between mb-6 pb-6 border-b">
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
        </div> */}

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
  return {
    title: `${blog.title} — The Const`,
    description: blog.thumbnail?.description || blog.title,
    openGraph: {
      images: blog.thumbnail?.image ? [blog.thumbnail.image] : [],
    },
  };
}
