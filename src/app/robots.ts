import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/app/", "/admin/", "/field/", "/onboarding/", "/api/"],
    },
    sitemap: "https://ehs360.app/sitemap.xml",
  };
}
