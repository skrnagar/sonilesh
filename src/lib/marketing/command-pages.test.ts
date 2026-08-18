import { describe, expect, it } from "vitest";
import { footerColumns, primaryNav } from "@/lib/marketing/nav";
import { marketingCommandPages, searchCommandPages } from "@/lib/marketing/command-pages";

function navHrefs() {
  const hrefs = new Set<string>(["/"]);
  for (const item of primaryNav) {
    hrefs.add(item.href.split("#")[0]!);
    for (const column of item.columns ?? []) {
      for (const link of column.links) hrefs.add(link.href.split("#")[0]!);
    }
    if (item.footer) hrefs.add(item.footer.href.split("#")[0]!);
  }
  for (const column of footerColumns) {
    for (const link of column.links) {
      const path = link.href.split("#")[0]!;
      if (!path.startsWith("http")) hrefs.add(path);
    }
  }
  return hrefs;
}

describe("marketing command pages", () => {
  it("only lists destinations already in nav or footer", () => {
    const allowed = navHrefs();
    const pages = marketingCommandPages();
    expect(pages.length).toBeGreaterThan(8);
    for (const page of pages) {
      const path = page.href.split("#")[0]!;
      expect(allowed.has(path), path).toBe(true);
      expect(path.startsWith("http")).toBe(false);
    }
  });

  it("fuzzy-matches existing pages", () => {
    const hits = searchCommandPages("brsr").map((p) => p.href);
    expect(hits.some((href) => href.includes("brsr"))).toBe(true);
    expect(searchCommandPages("zzzz-not-a-page")).toEqual([]);
  });
});
