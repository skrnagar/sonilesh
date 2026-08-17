import type { SupabaseClient } from "@supabase/supabase-js";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";

export type TenantScope = {
  scope: string;
  siteId: string | null;
  departmentId: string | null;
  businessUnitId: string | null;
  projectId: string | null;
};

/** Pure helpers — never a substitute for RLS. */
export function getCurrentOrganizationId(input: {
  cookieOrgId: string | null;
  membershipOrganizationIds: string[];
}) {
  if (
    input.cookieOrgId &&
    input.membershipOrganizationIds.includes(input.cookieOrgId)
  ) {
    return input.cookieOrgId;
  }
  return input.membershipOrganizationIds[0] ?? null;
}

export function resolveSiteContext(input: {
  requestedSiteId: string | null;
  siteIdsInOrg: string[];
}) {
  if (!input.requestedSiteId) return null;
  return input.siteIdsInOrg.includes(input.requestedSiteId)
    ? input.requestedSiteId
    : null;
}

export function resolveProjectContext(input: {
  requestedProjectId: string | null;
  projects: Array<{ id: string; site_id: string | null }>;
  currentSiteId: string | null;
}) {
  if (!input.requestedProjectId) return null;
  const project = input.projects.find((row) => row.id === input.requestedProjectId);
  if (!project) return null;
  if (input.currentSiteId && project.site_id && project.site_id !== input.currentSiteId) {
    return null;
  }
  return project.id;
}

export function scopesAllowSite(scopes: TenantScope[], siteId: string) {
  if (!scopes.length) return false;
  if (
    scopes.some(
      (row) =>
        row.scope === "organization" ||
        row.scope === "platform" ||
        row.scope === "business_unit",
    )
  ) {
    return true;
  }
  return scopes.some((row) => row.scope === "site" && row.siteId === siteId);
}

export async function getUserScope(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<TenantScope[]> {
  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return [];

  const { data } = await supabase
    .from("member_roles")
    .select("scope, site_id, department_id, business_unit_id, project_id")
    .eq("member_id", member.id)
    .is("deleted_at", null);

  return (data ?? []).map((row) => ({
    scope: row.scope === "own" ? "self" : row.scope,
    siteId: row.site_id,
    departmentId: row.department_id,
    businessUnitId: row.business_unit_id,
    projectId: row.project_id,
  }));
}

export async function getCurrentOrganization(
  supabase: SupabaseClient,
  organizationId: string,
) {
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function getCurrentSite(
  supabase: SupabaseClient,
  organizationId: string,
  siteId: string | null,
) {
  if (!siteId) return null;
  const { data } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function getCurrentProject(
  supabase: SupabaseClient,
  organizationId: string,
  projectId: string | null,
) {
  if (!projectId) return null;
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function getCurrentBusinessUnit(
  supabase: SupabaseClient,
  organizationId: string,
  businessUnitId: string | null,
) {
  if (!businessUnitId) return null;
  const { data } = await supabase
    .from("business_units")
    .select("*")
    .eq("id", businessUnitId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function getCurrentDepartment(
  supabase: SupabaseClient,
  organizationId: string,
  departmentId: string | null,
) {
  if (!departmentId) return null;
  const { data } = await supabase
    .from("departments")
    .select("*")
    .eq("id", departmentId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  return data;
}

export async function userRoleCodesInOrg(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const { roleCodes } = await getRoleCodesForUser(supabase, userId, organizationId);
  return roleCodes;
}
