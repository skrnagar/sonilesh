import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/marketing/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/field/", "/onboarding/", "/api/", "/compare/"],
    },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
