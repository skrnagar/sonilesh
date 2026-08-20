import type { Metadata } from "next";
import seoMap from "../../../content/seo-map.json";

export type SearchIntent = "transactional" | "commercial" | "informational";

export type SeoPage = {
  path: string;
  title: string;
  description: string;
  h1: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: SearchIntent | string;
  targetWordCount: number;
  indexed: boolean;
};

export const seoPages = seoMap.pages as SeoPage[];

export function siteUrl() {
  const raw = process.env.NEXT_PUBLIC_APP_URL || "https://sonilesh.vercel.app";
  return raw.replace(/\/$/, "");
}

export function getSeoEntry(path: string): SeoPage | undefined {
  const normalized = path === "" ? "/" : path.startsWith("/") ? path : `/${path}`;
  return seoPages.find((page) => page.path === normalized);
}

export function indexedSeoPages() {
  return seoPages.filter((page) => page.indexed);
}

export function metadataForPath(path: string, extra?: Metadata): Metadata {
  const entry = getSeoEntry(path);
  const canonical = `${siteUrl()}${path === "/" ? "" : path}`;
  if (!entry) {
    return {
      ...extra,
      alternates: { canonical, ...extra?.alternates },
    };
  }
  const robots = entry.indexed
    ? { index: true, follow: true }
    : { index: false, follow: false };
  return {
    title: entry.title,
    description: entry.description,
    alternates: { canonical },
    robots,
    openGraph: {
      type: "website",
      siteName: seoMap.siteName,
      title: entry.title,
      description: entry.description,
      url: canonical,
      images: [{ url: seoMap.defaultOgImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description: entry.description,
      images: [seoMap.defaultOgImage],
    },
    ...extra,
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "SONIL EHS360",
    legalName: "SONIL BUILDCON PRIVATE LIMITED",
    url: siteUrl(),
    email: "info@sonilbuildcon.com",
    telephone: "+91 93405 83565",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Indore",
      addressRegion: "Madhya Pradesh",
      postalCode: "452016",
      addressCountry: "IN",
    },
    parentOrganization: {
      "@type": "Organization",
      name: "SONIL BUILDCON PRIVATE LIMITED",
      url: "https://www.sonilbuildcon.com/",
    },
  };
}
