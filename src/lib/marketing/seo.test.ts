import { describe, expect, it } from "vitest";
import { indexedSeoPages, seoPages } from "@/lib/marketing/seo";

describe("seo-map", () => {
  it("gives every indexed page a unique title, description and H1", () => {
    const indexed = indexedSeoPages();
    const titles = indexed.map((p) => p.title);
    const descriptions = indexed.map((p) => p.description);
    const h1s = indexed.map((p) => p.h1);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(new Set(h1s).size).toBe(h1s.length);
  });

  it("keeps titles and descriptions within search-snippet bounds", () => {
    for (const page of seoPages) {
      expect(page.title.length, page.path).toBeLessThanOrEqual(60);
      expect(page.description.length, page.path).toBeLessThanOrEqual(160);
    }
  });

  it("does not index compare drafts", () => {
    const compare = seoPages.filter((p) => p.path.startsWith("/compare/"));
    expect(compare.length).toBeGreaterThan(0);
    expect(compare.every((p) => p.indexed === false)).toBe(true);
  });
});
