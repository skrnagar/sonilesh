import type { SupabaseClient } from "@supabase/supabase-js";
import { mapUaucStatusLabel } from "@/lib/services/uauc-list";

/** Event types that may carry iQuality observations in ehs_events. */
export const QUALITY_SOURCE_EVENT_TYPES = ["hazard", "safety_observation"] as const;

export type QualityObservationFilters = {
  businessUnitId?: string;
  regionId?: string;
  projectId?: string;
  fromDate?: string;
  toDate?: string;
  serialNumber?: string;
  status?: string;
};

export type QualityObservationRow = {
  id: string;
  eventNumber: string;
  locationNo: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
  categoryGroup: string;
  description: string;
  status: string;
  statusLabel: string;
  reportedByName: string;
  createdOn: string;
  closedByName: string | null;
  closedOn: string | null;
  businessUnitName: string | null;
  regionName: string | null;
  projectName: string | null;
  businessUnitId: string | null;
  regionId: string | null;
  projectId: string | null;
};

const QUALITY_SELECT = `
  id,
  event_number,
  status,
  occurred_at,
  created_at,
  closed_at,
  description,
  metadata,
  event_types:event_type_id(code, name),
  business_unit_id,
  project_id,
  sites:site_id(name, region_id, business_unit_id, regions:region_id(name), business_units:business_unit_id(name)),
  projects:project_id(name),
  business_units:business_unit_id(name),
  event_categories:event_category_id(name, code),
  reporter:reporter_id(full_name, email),
  created_by_profile:created_by(full_name, email),
  closed_by_profile:closed_by(full_name, email)
`;

function readMetaString(metadata: unknown, key: string): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readLocation(metadata: unknown): string | null {
  return (
    readMetaString(metadata, "location_text") ??
    readMetaString(metadata, "location_no") ??
    readMetaString(metadata, "location")
  );
}

function readSubcategory(metadata: unknown): string | null {
  return readMetaString(metadata, "subcategory") ?? readMetaString(metadata, "sub_category");
}

function readCategoryGroup(metadata: unknown, categoryName: string | null): string {
  return (
    readMetaString(metadata, "category_group") ??
    readMetaString(metadata, "report_domain") ??
    (categoryName?.toLowerCase() === "quality" ? "Quality" : "Quality")
  );
}

/** Detect iQuality observations stored in the shared ehs_events table. */
export function isQualityObservation(input: {
  eventNumber: string;
  metadata?: unknown;
  categoryName?: string | null;
  categoryCode?: string | null;
  eventTypeCode?: string | null;
}): boolean {
  if (/^QO/i.test(input.eventNumber.trim())) return true;

  const meta = input.metadata;
  const group = readMetaString(meta, "category_group");
  const domain = readMetaString(meta, "report_domain");
  const observationType = readMetaString(meta, "observation_type");

  if (group?.toLowerCase() === "quality") return true;
  if (domain?.toLowerCase() === "quality") return true;
  if (observationType?.toLowerCase() === "quality") return true;

  if (meta && typeof meta === "object" && (meta as Record<string, unknown>).quality === true) {
    return true;
  }

  if (input.categoryName?.toLowerCase() === "quality") return true;
  if (input.categoryCode?.toLowerCase() === "quality") return true;

  return false;
}

export function formatQualityObservationDate(value?: string | Date | null): string {
  if (!value) return "";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(date)
    .replace(/ /g, "-");
}

export function qualityObservationDetailPath(id: string): string {
  return `/field/ua-uc/${id}`;
}

export function filterQualityObservationRows(
  rows: QualityObservationRow[],
  filters: QualityObservationFilters,
): QualityObservationRow[] {
  return rows.filter((row) => {
    if (filters.businessUnitId && row.businessUnitId !== filters.businessUnitId) return false;
    if (filters.regionId && row.regionId !== filters.regionId) return false;
    if (filters.projectId && row.projectId !== filters.projectId) return false;

    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      if (!Number.isNaN(from.getTime()) && new Date(row.createdOn) < from) return false;
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      if (!Number.isNaN(to.getTime())) {
        to.setHours(23, 59, 59, 999);
        if (new Date(row.createdOn) > to) return false;
      }
    }

    if (filters.status === "open" && row.statusLabel !== "Open") return false;
    if (filters.status === "closed" && row.statusLabel !== "Closed") return false;
    if (
      filters.status &&
      !["open", "closed"].includes(filters.status) &&
      row.status !== filters.status
    ) {
      return false;
    }

    if (filters.serialNumber?.trim()) {
      const needle = filters.serialNumber.trim().toLowerCase();
      if (!row.eventNumber.toLowerCase().includes(needle)) return false;
    }

    return true;
  });
}

export type QualityObservationGroup = {
  businessUnitName: string;
  regions: {
    regionName: string;
    projects: {
      projectName: string;
      categories: {
        categoryGroup: string;
        rows: QualityObservationRow[];
      }[];
    }[];
  }[];
};

export function groupQualityObservations(rows: QualityObservationRow[]): QualityObservationGroup[] {
  const buMap = new Map<string, QualityObservationGroup>();

  for (const row of rows) {
    const buName = row.businessUnitName || "Unassigned SBU";
    if (!buMap.has(buName)) {
      buMap.set(buName, { businessUnitName: buName, regions: [] });
    }
    const bu = buMap.get(buName)!;

    const regionName = row.regionName || "Unassigned Region";
    let region = bu.regions.find((r) => r.regionName === regionName);
    if (!region) {
      region = { regionName, projects: [] };
      bu.regions.push(region);
    }

    const projectName = row.projectName || "Unassigned Project";
    let project = region.projects.find((p) => p.projectName === projectName);
    if (!project) {
      project = { projectName, categories: [] };
      region.projects.push(project);
    }

    const groupName = row.categoryGroup || "Quality";
    let category = project.categories.find((c) => c.categoryGroup === groupName);
    if (!category) {
      category = { categoryGroup: groupName, rows: [] };
      project.categories.push(category);
    }
    category.rows.push(row);
  }

  return [...buMap.values()];
}

async function loadTypeIds(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("event_types")
    .select("id, code")
    .is("organization_id", null)
    .in("code", [...QUALITY_SOURCE_EVENT_TYPES]);

  if (error) throw new Error(error.message);
  return new Map((data ?? []).map((row) => [row.code, row.id]));
}

async function siteIdsForRegion(
  supabase: SupabaseClient,
  organizationId: string,
  regionId: string,
) {
  const { data, error } = await supabase
    .from("sites")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("region_id", regionId)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => row.id);
}

function mapRow(row: Record<string, unknown>): QualityObservationRow | null {
  const typeCode = (row.event_types as { code?: string } | null)?.code ?? null;
  const category = row.event_categories as { name?: string; code?: string } | null;
  const categoryName = category?.name ?? null;
  const eventNumber = String(row.event_number ?? "");

  if (
    !isQualityObservation({
      eventNumber,
      metadata: row.metadata,
      categoryName,
      categoryCode: category?.code ?? null,
      eventTypeCode: typeCode,
    })
  ) {
    return null;
  }

  const site = row.sites as {
    name?: string;
    region_id?: string | null;
    business_unit_id?: string | null;
    regions?: { name?: string } | null;
    business_units?: { name?: string } | null;
  } | null;
  const reporter = row.reporter as { full_name?: string; email?: string } | null;
  const creator = row.created_by_profile as { full_name?: string; email?: string } | null;
  const closer = row.closed_by_profile as { full_name?: string; email?: string } | null;
  const metadata = row.metadata;

  return {
    id: String(row.id),
    eventNumber,
    locationNo: readLocation(metadata),
    categoryName,
    subcategoryName: readSubcategory(metadata),
    categoryGroup: readCategoryGroup(metadata, categoryName),
    description: String(row.description || "—"),
    status: String(row.status),
    statusLabel: mapUaucStatusLabel(String(row.status)),
    reportedByName:
      creator?.full_name || creator?.email || reporter?.full_name || reporter?.email || "—",
    createdOn: String(row.created_at ?? row.occurred_at),
    closedByName: closer?.full_name || closer?.email || null,
    closedOn: row.closed_at ? String(row.closed_at) : null,
    businessUnitName:
      (row.business_units as { name?: string } | null)?.name ??
      site?.business_units?.name ??
      null,
    regionName: site?.regions?.name ?? null,
    projectName: (row.projects as { name?: string } | null)?.name ?? null,
    businessUnitId: (row.business_unit_id as string | null) ?? site?.business_unit_id ?? null,
    regionId: site?.region_id ?? null,
    projectId: (row.project_id as string | null) ?? null,
  };
}

export async function listQualityObservations(
  supabase: SupabaseClient,
  organizationId: string,
  filters: QualityObservationFilters = {},
  opts?: { limit?: number },
): Promise<QualityObservationRow[]> {
  const typeIds = await loadTypeIds(supabase);
  const ids = [...typeIds.values()];
  if (!ids.length) return [];

  let query = supabase
    .from("ehs_events")
    .select(QUALITY_SELECT)
    .eq("organization_id", organizationId)
    .in("event_type_id", ids)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(opts?.limit ?? 500);

  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.businessUnitId) query = query.eq("business_unit_id", filters.businessUnitId);

  if (filters.regionId) {
    const siteIds = await siteIdsForRegion(supabase, organizationId, filters.regionId);
    if (!siteIds.length) return [];
    query = query.in("site_id", siteIds);
  }

  if (filters.fromDate) {
    const from = new Date(filters.fromDate);
    if (!Number.isNaN(from.getTime())) {
      query = query.gte("created_at", from.toISOString());
    }
  }

  if (filters.toDate) {
    const to = new Date(filters.toDate);
    if (!Number.isNaN(to.getTime())) {
      to.setHours(23, 59, 59, 999);
      query = query.lte("created_at", to.toISOString());
    }
  }

  if (filters.serialNumber?.trim()) {
    query = query.ilike("event_number", `%${filters.serialNumber.trim()}%`);
  }

  if (filters.status === "open") {
    query = query.not("status", "in", "(closed,cancelled)");
  } else if (filters.status === "closed") {
    query = query.eq("status", "closed");
  } else if (filters.status) {
    query = query.eq("status", filters.status);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => mapRow(row as Record<string, unknown>))
    .filter((row): row is QualityObservationRow => row !== null);
}

export async function getQualityObservationById(
  supabase: SupabaseClient,
  organizationId: string,
  eventId: string,
): Promise<QualityObservationRow | null> {
  const typeIds = await loadTypeIds(supabase);
  const ids = [...typeIds.values()];
  if (!ids.length) return null;

  const { data, error } = await supabase
    .from("ehs_events")
    .select(QUALITY_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", eventId)
    .in("event_type_id", ids)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}
