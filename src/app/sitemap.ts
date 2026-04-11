import type { MetadataRoute } from "next";
import connectDB from "@/lib/db";
import { Blog } from "@/models/Blog";
import { absoluteUrl, getBlogShareImage } from "@/lib/seo";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: absoluteUrl("/explore"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  try {
    await connectDB();
    const blogs = await Blog.find({ status: "approved" })
      .select("url thumbnail image publishedDate updatedAt")
      .lean();

    const blogEntries: MetadataRoute.Sitemap = blogs
      .filter((blog) => blog.url)
      .map((blog) => {
        const image = getBlogShareImage(blog);

        return {
          url: absoluteUrl(`/blog/${blog.url}`),
          lastModified: blog.updatedAt || blog.publishedDate || new Date(),
          changeFrequency: "weekly",
          priority: 0.7,
          images: image ? [image] : undefined,
        };
      });

    return [...staticEntries, ...blogEntries];
  } catch (error) {
    console.error("Failed to build sitemap:", error);
    return staticEntries;
  }
}
