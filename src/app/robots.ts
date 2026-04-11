import type { MetadataRoute } from "next";
import { absoluteUrl, siteConfig } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: ["/", "/blog/", "/explore", "/profile/"],
      disallow: [
        "/admin/",
        "/api/",
        "/login",
        "/messages/",
        "/network/",
        "/notifications/",
        "/register",
        "/saved/",
        "/settings/",
        "/write/",
      ],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: siteConfig.url,
  };
}
