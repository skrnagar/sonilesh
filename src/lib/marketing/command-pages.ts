import { footerColumns, primaryNav } from "@/lib/marketing/nav";

export type CommandPage = {
  href: string;
  title: string;
  group: string;
  keywords: string;
};

function addPage(
  pages: CommandPage[],
  seen: Set<string>,
  href: string,
  title: string,
  group: string,
  extra = "",
) {
  const [path] = href.split("#");
  if (!path || path.startsWith("http") || seen.has(path)) return;
  seen.add(path);
  pages.push({
    href,
    title,
    group,
    keywords: `${title} ${group} ${extra} ${path}`.toLowerCase(),
  });
}

/** Existing marketing destinations only — derived from nav + footer, never invented. */
export function marketingCommandPages(): CommandPage[] {
  const pages: CommandPage[] = [];
  const seen = new Set<string>();
  addPage(pages, seen, "/", "Home", "Site");
  for (const item of primaryNav) {
    addPage(pages, seen, item.href, item.label, "Site");
    for (const column of item.columns ?? []) {
      for (const link of column.links) {
        addPage(pages, seen, link.href, link.label, column.title, link.description ?? "");
      }
    }
    if (item.footer) {
      addPage(pages, seen, item.footer.href, item.footer.label, item.label);
    }
  }
  for (const column of footerColumns) {
    for (const link of column.links) {
      addPage(pages, seen, link.href, link.label, column.title);
    }
  }
  return pages;
}

export function fuzzyScore(query: string, ...fields: string[]): number {
  const q = query.trim().toLowerCase();
  if (!q) return 1;
  const hay = fields.join(" ").toLowerCase();
  const idx = hay.indexOf(q);
  if (idx >= 0) return 120 - idx + (hay.startsWith(q) ? 30 : 0);
  let qi = 0;
  let score = 20;
  for (let i = 0; i < hay.length && qi < q.length; i++) {
    if (hay[i] === q[qi]) {
      qi += 1;
      score += 2;
    }
  }
  return qi === q.length ? score : 0;
}

export function searchCommandPages(query: string, pages = marketingCommandPages()) {
  return pages
    .map((page) => ({
      page,
      score: fuzzyScore(query, page.title, page.group, page.keywords),
    }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title))
    .map((row) => row.page);
}
