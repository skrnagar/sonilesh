export type SearchHit = {
  module: string;
  id: string;
  title: string;
  href: string;
  status?: string | null;
};

export type SearchScope = {
  organizationId: string;
  siteId?: string | null;
  allowedSiteIds?: string[] | null;
};

export type SearchSourceRow = {
  id: string;
  title?: string | null;
  event_number?: string | null;
  name?: string | null;
  code?: string | null;
  status?: string | null;
  site_id?: string | null;
  organization_id: string;
};

/**
 * Security filter BEFORE ranking. Never dump unscoped rows to the client.
 */
export function filterSearchHits(input: {
  scope: SearchScope;
  rows: SearchSourceRow[];
  query: string;
  module: string;
  hrefFor: (row: SearchSourceRow) => string;
  titleFor?: (row: SearchSourceRow) => string;
}): SearchHit[] {
  const q = input.query.trim().toLowerCase();
  if (!q) return [];

  const scoped = input.rows.filter((row) => {
    if (row.organization_id !== input.scope.organizationId) return false;
    if (input.scope.siteId && row.site_id && row.site_id !== input.scope.siteId) return false;
    if (
      input.scope.allowedSiteIds &&
      row.site_id &&
      !input.scope.allowedSiteIds.includes(row.site_id)
    ) {
      return false;
    }
    return true;
  });

  return scoped
    .filter((row) => {
      const hay = [
        row.title,
        row.event_number,
        row.name,
        row.code,
        row.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    })
    .map((row) => ({
      module: input.module,
      id: row.id,
      title: input.titleFor?.(row) ?? row.title ?? row.name ?? row.event_number ?? row.id,
      href: input.hrefFor(row),
      status: row.status ?? null,
    }));
}
