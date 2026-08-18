import type { AnalyticsQuery } from "./types";

export function buildDrilldownHref(
  path: string,
  query: AnalyticsQuery,
  extra?: Record<string, string | undefined>,
) {
  const params = new URLSearchParams();
  if (query.range) params.set("range", query.range);
  if (query.siteId) params.set("siteId", query.siteId);
  if (query.projectId) params.set("projectId", query.projectId);
  if (query.departmentId) params.set("departmentId", query.departmentId);
  if (query.businessUnitId) params.set("businessUnitId", query.businessUnitId);
  if (query.dateFrom) params.set("dateFrom", query.dateFrom);
  if (query.dateTo) params.set("dateTo", query.dateTo);
  for (const [key, value] of Object.entries(extra ?? {})) {
    if (value) params.set(key, value);
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}
