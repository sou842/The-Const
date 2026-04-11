import type { Metadata } from "next";
import connectDB from "@/lib/db";
import { User } from "@/models/User";
import { absoluteUrl, siteConfig, stripHtml, truncate } from "@/lib/seo";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  try {
    await connectDB();
    const user = await User.findById(id)
      .select("name profession shortBio longBio profilePhoto")
      .lean();

    if (!user) {
      return {
        title: "Profile Not Found",
        robots: {
          index: false,
          follow: false,
        },
      };
    }

    const description = truncate(
      stripHtml(user.shortBio || user.longBio || `${user.name} on ${siteConfig.name}`),
      160,
    );
    const title = user.profession
      ? `${user.name} | ${user.profession}`
      : `${user.name} | ${siteConfig.name}`;
    const canonical = absoluteUrl(`/profile/${id}`);

    return {
      title,
      description,
      alternates: {
        canonical,
      },
      openGraph: {
        title,
        description,
        type: "profile",
        url: canonical,
        images: user.profilePhoto ? [{ url: user.profilePhoto }] : undefined,
      },
      twitter: {
        card: user.profilePhoto ? "summary_large_image" : "summary",
        title,
        description,
        images: user.profilePhoto ? [user.profilePhoto] : undefined,
      },
    };
  } catch (error) {
    console.error("Failed to generate profile metadata:", error);
    return {
      title: siteConfig.name,
      description: siteConfig.description,
    };
  }
}

export default function PublicProfileLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
