import type { MetadataRoute } from "next";
import { glossaryEntries } from "@/lib/marketing/glossary";
import { listResourcePosts } from "@/lib/marketing/mdx";
import { indexedSeoPages, siteUrl } from "@/lib/marketing/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const origin = siteUrl();
  const now = new Date();

  const pages = indexedSeoPages().map((page) => ({
    url: `${origin}${page.path === "/" ? "" : page.path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: page.path === "/" ? 1 : 0.7,
  }));

  const glossary = glossaryEntries.map((term) => ({
    url: `${origin}/resources/glossary/${term.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }));

  const posts = listResourcePosts().map((post) => ({
    url: `${origin}/resources/${post.slug}`,
    lastModified: post.updatedAt ? new Date(post.updatedAt) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...pages, ...glossary, ...posts];
}
