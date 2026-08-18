import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";
import { checkLimit } from "@/lib/services/entitlements";
import { requirePermission } from "@/lib/services/rbac";
import { slugify } from "@/lib/utils";

export class PlanLimitError extends Error {
  metric: string;
  limit: number | null;
  constructor(metric: string, limit: number | null, message: string) {
    super(message);
    this.name = "PlanLimitError";
    this.metric = metric;
    this.limit = limit;
  }
}

async function assertOrgMember(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Organization access required");
  return data.id as string;
}

async function assertHierarchyManageAccess(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  await assertOrgMember(supabase, organizationId, userId);
  await requirePermission(supabase, organizationId, userId, "settings.manage");
}

function codeOrSlug(value: string, fallback: string) {
  const raw = value.trim() || fallback;
  return raw.toUpperCase().replace(/[^A-Z0-9_-]+/g, "_").slice(0, 32);
}

export async function createBusinessUnit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    code?: string;
    description?: string;
    headMemberId?: string | null;
  },
) {
  await assertHierarchyManageAccess(supabase, input.organizationId, input.userId);
  const code = codeOrSlug(input.code || slugify(input.name), "BU");
  const { data, error } = await supabase
    .from("business_units")
    .insert({
      organization_id: input.organizationId,
      name: input.name.trim(),
      code,
      description: input.description ?? null,
      head_member_id: input.headMemberId ?? null,
      status: "active",
      is_active: true,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "business_unit.created",
    entityType: "business_unit",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function updateBusinessUnit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    id: string;
    name?: string;
    description?: string | null;
    headMemberId?: string | null;
    status?: "active" | "inactive" | "archived";
  },
) {
  await assertHierarchyManageAccess(supabase, input.organizationId, input.userId);
  const { data: previous } = await supabase
    .from("business_units")
    .select("*")
    .eq("id", input.id)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  const { data, error } = await supabase
    .from("business_units")
    .update({
      name: input.name,
      description: input.description,
      head_member_id: input.headMemberId,
      status: input.status,
      is_active: input.status ? input.status === "active" : undefined,
      updated_by: input.userId,
      deleted_at: input.status === "archived" ? new Date().toISOString() : null,
    })
    .eq("id", input.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "business_unit.updated",
    entityType: "business_unit",
    entityId: data.id,
    previousValues: previous,
    newValues: data,
  });
  return data;
}

export async function createSiteRecord(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    code?: string;
    businessUnitId?: string | null;
    address?: string;
    country?: string;
    state?: string;
    city?: string;
    latitude?: number | null;
    longitude?: number | null;
    timezone?: string;
    locale?: string;
    currency?: string;
    jurisdictionId?: string | null;
    siteManagerMemberId?: string | null;
    siteType?: "permanent" | "temporary_project";
    startDate?: string | null;
    endDate?: string | null;
  },
) {
  await assertHierarchyManageAccess(supabase, input.organizationId, input.userId);
  const limit = await checkLimit(supabase, input.organizationId, "max_sites", 1);
  if (!limit.allowed) {
    throw new PlanLimitError(
      "max_sites",
      limit.limit,
      `Your current plan allows ${limit.limit ?? 0} sites. Upgrade your plan or contact sales.`,
    );
  }
  if (input.businessUnitId) {
    const { data: bu } = await supabase
      .from("business_units")
      .select("id")
      .eq("id", input.businessUnitId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!bu) throw new Error("Business unit must belong to this organization");
  }
  const code = codeOrSlug(input.code || slugify(input.name), "SITE");
  const { data, error } = await supabase
    .from("sites")
    .insert({
      organization_id: input.organizationId,
      business_unit_id: input.businessUnitId ?? null,
      name: input.name.trim(),
      code,
      address: input.address ?? null,
      country: input.country ?? null,
      state: input.state ?? null,
      city: input.city ?? null,
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      timezone: input.timezone ?? null,
      locale: input.locale ?? null,
      currency: input.currency ?? null,
      jurisdiction_id: input.jurisdictionId ?? null,
      site_manager_member_id: input.siteManagerMemberId ?? null,
      site_type: input.siteType ?? "permanent",
      status: "active",
      start_date: input.startDate ?? null,
      end_date: input.endDate ?? null,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "site.created",
    entityType: "site",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function updateSiteRecord(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    id: string;
    patch: Record<string, unknown>;
  },
) {
  await assertHierarchyManageAccess(supabase, input.organizationId, input.userId);
  const { data: previous } = await supabase
    .from("sites")
    .select("*")
    .eq("id", input.id)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  const { data, error } = await supabase
    .from("sites")
    .update({ ...input.patch, updated_by: input.userId })
    .eq("id", input.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "site.updated",
    entityType: "site",
    entityId: data.id,
    previousValues: previous,
    newValues: data,
  });
  return data;
}

export async function createProjectRecord(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    code?: string;
    businessUnitId?: string | null;
    siteId?: string | null;
    projectType?: string | null;
    clientName?: string | null;
    projectManagerMemberId?: string | null;
    startDate?: string | null;
    expectedEndDate?: string | null;
    status?: string;
  },
) {
  await assertHierarchyManageAccess(supabase, input.organizationId, input.userId);
  const limit = await checkLimit(supabase, input.organizationId, "max_projects", 1);
  if (!limit.allowed) {
    throw new PlanLimitError(
      "max_projects",
      limit.limit,
      `Your current plan allows ${limit.limit ?? 0} projects. Upgrade your plan or contact sales.`,
    );
  }
  if (input.siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", input.siteId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!site) throw new Error("Site must belong to this organization");
  }
  if (input.businessUnitId) {
    const { data: bu } = await supabase
      .from("business_units")
      .select("id")
      .eq("id", input.businessUnitId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!bu) throw new Error("Business unit must belong to this organization");
  }
  const code = codeOrSlug(input.code || slugify(input.name), "PRJ");
  const { data, error } = await supabase
    .from("projects")
    .insert({
      organization_id: input.organizationId,
      business_unit_id: input.businessUnitId ?? null,
      site_id: input.siteId ?? null,
      name: input.name.trim(),
      code,
      project_type: input.projectType ?? null,
      client_name: input.clientName ?? null,
      project_manager_member_id: input.projectManagerMemberId ?? null,
      start_date: input.startDate ?? null,
      expected_end_date: input.expectedEndDate ?? null,
      status: input.status ?? "planning",
      is_active: true,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "project.created",
    entityType: "project",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function updateProjectRecord(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    id: string;
    patch: Record<string, unknown>;
  },
) {
  await assertHierarchyManageAccess(supabase, input.organizationId, input.userId);
  const { data: previous } = await supabase
    .from("projects")
    .select("*")
    .eq("id", input.id)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  const { data, error } = await supabase
    .from("projects")
    .update({ ...input.patch, updated_by: input.userId })
    .eq("id", input.id)
    .eq("organization_id", input.organizationId)
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "project.updated",
    entityType: "project",
    entityId: data.id,
    previousValues: previous,
    newValues: data,
  });
  return data;
}

export async function createDepartmentRecord(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    code?: string;
    siteId?: string | null;
    businessUnitId?: string | null;
    headMemberId?: string | null;
  },
) {
  await assertHierarchyManageAccess(supabase, input.organizationId, input.userId);
  if (input.siteId) {
    const { data: site } = await supabase
      .from("sites")
      .select("id")
      .eq("id", input.siteId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!site) throw new Error("Site must belong to this organization");
  }
  const code = codeOrSlug(input.code || slugify(input.name), "DEPT");
  const { data, error } = await supabase
    .from("departments")
    .insert({
      organization_id: input.organizationId,
      site_id: input.siteId ?? null,
      business_unit_id: input.businessUnitId ?? null,
      name: input.name.trim(),
      code,
      head_member_id: input.headMemberId ?? null,
      status: "active",
      is_active: true,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "department.created",
    entityType: "department",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function createLocationRecord(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    name: string;
    code?: string;
    siteId: string;
    projectId?: string | null;
    parentLocationId?: string | null;
    locationType?: string;
    description?: string | null;
  },
) {
  await assertHierarchyManageAccess(supabase, input.organizationId, input.userId);
  const { data: site } = await supabase
    .from("sites")
    .select("id")
    .eq("id", input.siteId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (!site) throw new Error("Site must belong to this organization");
  if (input.projectId) {
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("id", input.projectId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!project) throw new Error("Project must belong to this organization");
  }
  if (input.parentLocationId) {
    const { data: parent } = await supabase
      .from("locations")
      .select("id")
      .eq("id", input.parentLocationId)
      .eq("organization_id", input.organizationId)
      .maybeSingle();
    if (!parent) throw new Error("Parent location must belong to this organization");
  }
  const code = codeOrSlug(input.code || slugify(input.name), "LOC");
  const { data, error } = await supabase
    .from("locations")
    .insert({
      organization_id: input.organizationId,
      site_id: input.siteId,
      project_id: input.projectId ?? null,
      parent_location_id: input.parentLocationId ?? null,
      name: input.name.trim(),
      code,
      location_type: input.locationType ?? "other",
      description: input.description ?? null,
      status: "active",
      is_active: true,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "location.created",
    entityType: "location",
    entityId: data.id,
    newValues: data,
  });
  return data;
}

export async function getOrganizationStructure(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const [
    { data: businessUnits },
    { data: sites },
    { data: projects },
    { data: departments },
    { data: locations },
  ] = await Promise.all([
    supabase
      .from("business_units")
      .select("id, name, code, status, description")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("sites")
      .select("id, name, code, status, business_unit_id, city")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("projects")
      .select("id, name, code, status, site_id, business_unit_id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("departments")
      .select("id, name, code, status, site_id, business_unit_id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("locations")
      .select("id, name, code, status, site_id, project_id, parent_location_id")
      .eq("organization_id", organizationId)
      .is("deleted_at", null)
      .order("name"),
  ]);

  return {
    businessUnits: businessUnits ?? [],
    sites: sites ?? [],
    projects: projects ?? [],
    departments: departments ?? [],
    locations: locations ?? [],
  };
}

export type StructureNode = {
  id: string;
  label: string;
  kind: "organization" | "business_unit" | "site" | "project" | "department" | "location";
  meta?: string;
  children: StructureNode[];
};

export function buildStructureTree(
  orgName: string,
  structure: Awaited<ReturnType<typeof getOrganizationStructure>>,
): StructureNode {
  const root: StructureNode = {
    id: "org",
    label: orgName,
    kind: "organization",
    children: [],
  };

  const buNodes = new Map<string, StructureNode>();
  for (const bu of structure.businessUnits) {
    const node: StructureNode = {
      id: bu.id,
      label: bu.name,
      kind: "business_unit",
      meta: bu.code,
      children: [],
    };
    buNodes.set(bu.id, node);
    root.children.push(node);
  }

  const siteNodes = new Map<string, StructureNode>();
  for (const site of structure.sites) {
    const node: StructureNode = {
      id: site.id,
      label: site.name,
      kind: "site",
      meta: site.code,
      children: [],
    };
    siteNodes.set(site.id, node);
    const parent = site.business_unit_id ? buNodes.get(site.business_unit_id) : null;
    (parent ?? root).children.push(node);
  }

  for (const project of structure.projects) {
    const node: StructureNode = {
      id: project.id,
      label: project.name,
      kind: "project",
      meta: project.status,
      children: [],
    };
    const parent = project.site_id
      ? siteNodes.get(project.site_id)
      : project.business_unit_id
        ? buNodes.get(project.business_unit_id)
        : null;
    (parent ?? root).children.push(node);
  }

  for (const dept of structure.departments) {
    const node: StructureNode = {
      id: dept.id,
      label: dept.name,
      kind: "department",
      meta: dept.code,
      children: [],
    };
    const parent = dept.site_id
      ? siteNodes.get(dept.site_id)
      : dept.business_unit_id
        ? buNodes.get(dept.business_unit_id)
        : null;
    (parent ?? root).children.push(node);
  }

  const locationNodes = new Map<string, StructureNode>();
  for (const loc of structure.locations) {
    locationNodes.set(loc.id, {
      id: loc.id,
      label: loc.name,
      kind: "location",
      meta: loc.code,
      children: [],
    });
  }
  for (const loc of structure.locations) {
    const node = locationNodes.get(loc.id)!;
    if (loc.parent_location_id && locationNodes.has(loc.parent_location_id)) {
      locationNodes.get(loc.parent_location_id)!.children.push(node);
    } else {
      const parent = loc.site_id ? siteNodes.get(loc.site_id) : null;
      (parent ?? root).children.push(node);
    }
  }

  return root;
}
