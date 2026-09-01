import type { SupabaseClient } from "@supabase/supabase-js";

export const UAUC_EVENT_TYPES = ["unsafe_act", "unsafe_condition", "safety_observation"] as const;

export type UaucEventType = (typeof UAUC_EVENT_TYPES)[number];

export type UaucListFilters = {
  businessUnitId?: string;
  regionId?: string;
  projectId?: string;
  /** unsafe_act | unsafe_condition | safety_observation | wsn */
  incidentType?: string;
  /** open | closed | or raw workflow status */
  status?: string;
  serialNumber?: string;
};

export type UaucListRow = {
  id: string;
  eventNumber: string;
  incidentTypeCode: string;
  incidentTypeLabel: string;
  occurredAt: string;
  reportedAt: string | null;
  description: string;
  createdByName: string;
  actionItemCount: number;
  status: string;
  statusLabel: string;
  businessUnitName: string | null;
  regionName: string | null;
  projectName: string | null;
  businessUnitId: string | null;
  regionId: string | null;
  projectId: string | null;
  siteName: string | null;
  categoryName: string | null;
  subcategoryName: string | null;
  locationText: string | null;
};

const UAUC_SELECT = `
  id,
  event_number,
  status,
  occurred_at,
  reported_at,
  description,
  metadata,
  event_types:event_type_id(code, name),
  business_unit_id,
  project_id,
  sites:site_id(name, region_id, business_unit_id, regions:region_id(name), business_units:business_unit_id(name)),
  projects:project_id(name),
  business_units:business_unit_id(name),
  event_categories:event_category_id(name),
  reporter:reporter_id(full_name, email),
  created_by_profile:created_by(full_name, email)
`;

const TERMINAL_STATUSES = new Set(["closed", "cancelled"]);

export function mapUaucStatusLabel(status: string): string {
  if (TERMINAL_STATUSES.has(status)) {
    return status === "closed" ? "Closed" : "Cancelled";
  }
  return "Open";
}

export function isUaucOpen(status: string): boolean {
  return !TERMINAL_STATUSES.has(status);
}

export function resolveUaucTypeCode(input: string): UaucEventType | null {
  const normalized = input.trim().toLowerCase();
  if (normalized === "ua" || normalized === "unsafe_act") return "unsafe_act";
  if (normalized === "uc" || normalized === "unsafe_condition") return "unsafe_condition";
  if (normalized === "wsn" || normalized === "safety_observation") return "safety_observation";
  if ((UAUC_EVENT_TYPES as readonly string[]).includes(normalized)) {
    return normalized as UaucEventType;
  }
  return null;
}

export function incidentTypeLabel(code: string): string {
  if (code === "unsafe_act") return "Unsafe Act";
  if (code === "unsafe_condition") return "Unsafe Condition";
  if (code === "safety_observation") return "WSN";
  return code;
}

function readLocation(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const meta = metadata as Record<string, unknown>;
  const location = meta.location_text ?? meta.location ?? meta.gps;
  return typeof location === "string" && location.trim() ? location.trim() : null;
}

function readSubcategory(metadata: unknown): string | null {
  if (!metadata || typeof metadata !== "object") return null;
  const sub = (metadata as Record<string, unknown>).subcategory;
  return typeof sub === "string" && sub.trim() ? sub.trim() : null;
}

export function filterUaucRows(rows: UaucListRow[], filters: UaucListFilters): UaucListRow[] {
  return rows.filter((row) => {
    if (filters.businessUnitId && row.businessUnitName) {
      // Client-side BU filter uses names when ids are unavailable on row.
    }
    if (filters.incidentType) {
      const code = resolveUaucTypeCode(filters.incidentType);
      if (code && row.incidentTypeCode !== code) return false;
    }
    if (filters.status === "open" && !isUaucOpen(row.status)) return false;
    if (filters.status === "closed" && row.status !== "closed") return false;
    if (
      filters.status &&
      !["open", "closed"].includes(filters.status) &&
      row.status !== filters.status
    ) {
      return false;
    }
    if (filters.serialNumber) {
      const needle = filters.serialNumber.trim().toLowerCase();
      if (!row.eventNumber.toLowerCase().includes(needle)) return false;
    }
    return true;
  });
}

async function loadTypeIds(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("event_types")
    .select("id, code")
    .is("organization_id", null)
    .in("code", [...UAUC_EVENT_TYPES]);

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

export async function listUaucEvents(
  supabase: SupabaseClient,
  organizationId: string,
  filters: UaucListFilters = {},
  opts?: { limit?: number },
): Promise<UaucListRow[]> {
  const typeIds = await loadTypeIds(supabase);
  const ids = [...typeIds.values()];
  if (!ids.length) return [];

  let query = supabase
    .from("ehs_events")
    .select(UAUC_SELECT)
    .eq("organization_id", organizationId)
    .in("event_type_id", ids)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(opts?.limit ?? 150);

  const incidentCode = filters.incidentType ? resolveUaucTypeCode(filters.incidentType) : null;
  if (incidentCode) {
    const typeId = typeIds.get(incidentCode);
    if (typeId) query = query.eq("event_type_id", typeId);
  }

  if (filters.projectId) query = query.eq("project_id", filters.projectId);
  if (filters.businessUnitId) query = query.eq("business_unit_id", filters.businessUnitId);

  if (filters.regionId) {
    const siteIds = await siteIdsForRegion(supabase, organizationId, filters.regionId);
    if (!siteIds.length) return [];
    query = query.in("site_id", siteIds);
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
  const events = data ?? [];
  if (!events.length) return [];

  const eventIds = events.map((row) => row.id);
  const { data: capas, error: capaError } = await supabase
    .from("capa_items")
    .select("event_id")
    .in("event_id", eventIds)
    .is("deleted_at", null);

  if (capaError) throw new Error(capaError.message);

  const capaCounts = new Map<string, number>();
  for (const capa of capas ?? []) {
    const id = capa.event_id as string;
    capaCounts.set(id, (capaCounts.get(id) ?? 0) + 1);
  }

  return events.map((row) => {
    const typeCode =
      (row.event_types as { code?: string } | null)?.code ?? "unsafe_act";
    const site = row.sites as {
      name?: string;
      region_id?: string | null;
      business_unit_id?: string | null;
      regions?: { name?: string } | null;
      business_units?: { name?: string } | null;
    } | null;
    const reporter = row.reporter as { full_name?: string; email?: string } | null;
    const creator = row.created_by_profile as { full_name?: string; email?: string } | null;

    return {
      id: row.id,
      eventNumber: row.event_number,
      incidentTypeCode: typeCode,
      incidentTypeLabel: incidentTypeLabel(typeCode),
      occurredAt: row.occurred_at,
      reportedAt: row.reported_at,
      description: row.description || "—",
      createdByName:
        creator?.full_name || creator?.email || reporter?.full_name || reporter?.email || "—",
      actionItemCount: capaCounts.get(row.id) ?? 0,
      status: row.status,
      statusLabel: mapUaucStatusLabel(row.status),
      businessUnitName:
        (row.business_units as { name?: string } | null)?.name ??
        site?.business_units?.name ??
        null,
      regionName: site?.regions?.name ?? null,
      projectName: (row.projects as { name?: string } | null)?.name ?? null,
      businessUnitId: row.business_unit_id ?? site?.business_unit_id ?? null,
      regionId: site?.region_id ?? null,
      projectId: row.project_id ?? null,
      siteName: site?.name ?? null,
      categoryName: (row.event_categories as { name?: string } | null)?.name ?? null,
      subcategoryName: readSubcategory(row.metadata),
      locationText: readLocation(row.metadata),
    };
  });
}

export async function getUaucEventDetail(
  supabase: SupabaseClient,
  organizationId: string,
  eventId: string,
) {
  const typeIds = await loadTypeIds(supabase);
  const ids = [...typeIds.values()];
  if (!ids.length) return null;

  const { data, error } = await supabase
    .from("ehs_events")
    .select(UAUC_SELECT)
    .eq("organization_id", organizationId)
    .eq("id", eventId)
    .in("event_type_id", ids)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const capaRes = await supabase
    .from("capa_items")
    .select("id, title, status")
    .eq("event_id", eventId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const typeCode = (data.event_types as { code?: string } | null)?.code ?? "unsafe_act";
  const site = data.sites as {
    name?: string;
    region_id?: string | null;
    business_unit_id?: string | null;
    regions?: { name?: string } | null;
    business_units?: { name?: string } | null;
  } | null;
  const reporter = data.reporter as { full_name?: string; email?: string } | null;
  const creator = data.created_by_profile as { full_name?: string; email?: string } | null;

  return {
    id: data.id,
    eventNumber: data.event_number,
    incidentTypeCode: typeCode,
    incidentTypeLabel: incidentTypeLabel(typeCode),
    occurredAt: data.occurred_at,
    reportedAt: data.reported_at,
    description: data.description || "—",
    createdByName:
      creator?.full_name || creator?.email || reporter?.full_name || reporter?.email || "—",
    status: data.status,
    statusLabel: mapUaucStatusLabel(data.status),
    businessUnitName:
      (data.business_units as { name?: string } | null)?.name ??
      site?.business_units?.name ??
      null,
    regionName: site?.regions?.name ?? null,
    projectName: (data.projects as { name?: string } | null)?.name ?? null,
    businessUnitId: data.business_unit_id ?? site?.business_unit_id ?? null,
    regionId: site?.region_id ?? null,
    projectId: data.project_id ?? null,
    siteName: site?.name ?? null,
    categoryName: (data.event_categories as { name?: string } | null)?.name ?? null,
    subcategoryName: readSubcategory(data.metadata),
    locationText: readLocation(data.metadata),
    actionItems: capaRes.data ?? [],
  };
}
