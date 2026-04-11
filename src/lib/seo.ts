import type { Metadata } from "next";
import type { BlogPost } from "@/types/blog";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export const siteConfig = {
  name: "The Const",
  shortName: "The Const",
  description:
    "The Const is a professional networking platform for sharing industry insights, publishing ideas, and building meaningful career connections.",
  locale: "en_US",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://theconst.com").replace(
    /\/$/,
    "",
  ),
};

export function absoluteUrl(path = "/") {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return new URL(normalizedPath, `${siteConfig.url}/`).toString();
}

export function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function truncate(value: string, maxLength = 160) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}...`;
}

function collectText(value: unknown): string[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    const clean = stripHtml(value);
    return clean ? [clean] : [];
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectText);
  }

  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(collectText);
  }

  return [];
}

export function getEditorText(blocks: unknown, maxLength = 220) {
  const text = collectText(blocks).join(" ").replace(/\s+/g, " ").trim();
  return text ? truncate(text, maxLength) : "";
}

export function getBlogDescription(blog: Partial<BlogPost>) {
  const candidates = [
    blog.thumbnail?.description,
    getEditorText(blog.body, 220),
    blog.title,
  ].filter(Boolean) as string[];

  return truncate(candidates[0] || siteConfig.description, 160);
}

export function getBlogKeywords(blog: Partial<BlogPost>) {
  return Array.from(
    new Set(
      [blog.category, ...(blog.tags || [])]
        .map((value) => value?.trim())
        .filter(Boolean) as string[],
    ),
  );
}

export function getBlogShareImage(blog: Partial<BlogPost>) {
  if (blog.thumbnail?.type === "multiple-images" && blog.thumbnail.urls?.length) {
    return blog.thumbnail.urls[0];
  }

  return (
    blog.thumbnail?.url ||
    blog.thumbnail?.image ||
    blog.image ||
    absoluteUrl("/opengraph-image")
  );
}

export function createNoIndexMetadata(
  title: string,
  description: string,
  path?: string,
): Metadata {
  return {
    title,
    description,
    alternates: path ? { canonical: absoluteUrl(path) } : undefined,
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        "max-image-preview": "none",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

export function buildOrganizationJsonLd(): JsonValue {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/favicon.ico"),
  };
}

export function buildWebsiteJsonLd(): JsonValue {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      "@type": "SearchAction",
      target: `${absoluteUrl("/explore")}?query={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildArticleJsonLd(
  blog: Partial<BlogPost>,
  pathname: string,
): JsonValue {
  const image = getBlogShareImage(blog);
  const description = getBlogDescription(blog);
  const keywords = getBlogKeywords(blog);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: blog.title || siteConfig.name,
    description,
    image: image ? [image] : undefined,
    datePublished: blog.publishedDate
      ? new Date(blog.publishedDate).toISOString()
      : undefined,
    dateModified: blog.updatedAt ? new Date(blog.updatedAt).toISOString() : undefined,
    mainEntityOfPage: absoluteUrl(pathname),
    author: {
      "@type": "Person",
      name: blog.author || "The Const",
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: absoluteUrl("/favicon.ico"),
      },
    },
    articleSection: blog.category || undefined,
    keywords: keywords.length ? keywords.join(", ") : undefined,
    inLanguage: blog.language || "en",
  };
}
