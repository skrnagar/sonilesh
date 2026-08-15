import type { MetadataRoute } from "next";
import { industries, modules } from "@/lib/marketing/content";

const site = "https://ehs360.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    "",
    "/platform",
    "/solutions",
    "/features",
    "/modules",
    "/field-experience",
    "/enterprise",
    "/security",
    "/pricing",
    "/resources",
    "/about",
    "/contact",
    "/request-demo",
    "/login",
  ];

  const now = new Date();

  return [
    ...staticRoutes.map((path) => ({
      url: `${site}${path}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.7,
    })),
    ...industries.map((i) => ({
      url: `${site}/solutions/${i.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...modules.map((m) => ({
      url: `${site}/modules/${m.slug}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
