import type { Metadata } from "next";
import { AppLayout } from "@/components/layout/AppLayout";
import { MobileNav } from "@/components/layout/MobileNav";
import { getSession } from "@/lib/auth";
import { getFeedBlogs } from "@/lib/server/blogs";
import { FeedClient } from "@/components/feed/FeedClient";
import { absoluteUrl, siteConfig } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Professional Networking and Insight Publishing",
  description:
    "Discover expert posts, build meaningful connections, and grow your professional reputation on The Const.",
  alternates: {
    canonical: absoluteUrl("/"),
  },
  openGraph: {
    title: siteConfig.name,
    description:
      "Discover expert posts, build meaningful connections, and grow your professional reputation on The Const.",
    url: absoluteUrl("/"),
  },
};

export default async function Home() {
  let initialBlogs = [];
  let initialError = false;
  try {
    const session = await getSession().catch(() => null);
    const data = await getFeedBlogs({
      page: 1,
      limit: 20,
      userId: session?.userId ?? null,
    });
    initialBlogs = data.blogs || [];
  } catch {
    initialError = true;
  }

  return (
    <AppLayout>
      <FeedClient initialBlogs={initialBlogs} initialError={initialError} />
      <MobileNav />
    </AppLayout>
  );
}
