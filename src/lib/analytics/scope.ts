import type { TenantScope } from "@/lib/tenancy/context";

export type SiteRow = { id: string; name: string; business_unit_id?: string | null };

/**
 * null = organization-wide (all sites the caller can list).
 * [] = site-scoped with no matching sites — aggregates must be empty.
 */
export function resolveAccessibleSiteIds(
  scopes: TenantScope[],
  sites: SiteRow[],
  requestedSiteId?: string | null,
): string[] | null {
  const siteIds = sites.map((s) => s.id);
  const hasOrgWide = scopes.some(
    (row) => row.scope === "organization" || row.scope === "platform",
  );

  let allowed: string[] | null;
  if (!scopes.length || hasOrgWide) {
    allowed = null;
  } else {
    const set = new Set<string>();
    for (const row of scopes) {
      if (row.scope === "site" && row.siteId) set.add(row.siteId);
      if (row.scope === "business_unit" && row.businessUnitId) {
        for (const site of sites) {
          if (site.business_unit_id === row.businessUnitId) set.add(site.id);
        }
      }
    }
    allowed = [...set].filter((id) => siteIds.includes(id));
  }

  if (requestedSiteId) {
    if (allowed === null) {
      return siteIds.includes(requestedSiteId) ? [requestedSiteId] : [];
    }
    return allowed.includes(requestedSiteId) ? [requestedSiteId] : [];
  }

  return allowed;
}

export function filterByAccessibleSites<T extends { site_id?: string | null }>(
  rows: T[],
  accessibleSiteIds: string[] | null,
) {
  if (accessibleSiteIds === null) return rows;
  if (!accessibleSiteIds.length) return [] as T[];
  const set = new Set(accessibleSiteIds);
  return rows.filter((row) => row.site_id && set.has(row.site_id));
}

export function applySiteFilter<T>(
  query: T & { in: (column: string, values: string[]) => T },
  accessibleSiteIds: string[] | null,
  column = "site_id",
) {
  if (accessibleSiteIds === null) return query;
  if (!accessibleSiteIds.length) return query.in(column, ["00000000-0000-0000-0000-000000000000"]);
  return query.in(column, accessibleSiteIds);
}

export function analyticsCacheKey(parts: {
  organizationId: string;
  userId: string;
  range: string;
  siteIds: string[] | null;
  projectId?: string;
  departmentId?: string;
  businessUnitId?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const sites = parts.siteIds === null ? "*" : parts.siteIds.slice().sort().join(",");
  return [
    "analytics",
    parts.organizationId,
    parts.userId,
    parts.range,
    sites,
    parts.projectId || "",
    parts.departmentId || "",
    parts.businessUnitId || "",
    parts.dateFrom || "",
    parts.dateTo || "",
  ].join(":");
}

export function isolateTenantRows<T extends { organization_id: string }>(
  rows: T[],
  organizationId: string,
) {
  return rows.filter((row) => row.organization_id === organizationId);
}
