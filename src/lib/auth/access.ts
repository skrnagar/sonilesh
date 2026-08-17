import type { SupabaseClient } from "@supabase/supabase-js";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import { hasFeature as hasFeatureEntitled } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";

export { hasFeatureEntitled as hasFeature };

export async function hasPermission(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  permissionCode: string,
) {
  return userHasPermission(supabase, organizationId, userId, permissionCode);
}

export async function hasRole(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  roleCode: string,
) {
  const { roleCodes } = await getRoleCodesForUser(supabase, userId, organizationId);
  return roleCodes.includes(roleCode);
}

/** URL `organization_id` is never sufficient — membership or platform role must match. */
export function authorizeOrganizationAccess(input: {
  requestedOrganizationId: string;
  membershipOrganizationIds: string[];
  isPlatformAdmin: boolean;
}) {
  if (input.isPlatformAdmin) return true;
  return input.membershipOrganizationIds.includes(input.requestedOrganizationId);
}

export async function canAccessOrganization(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", userId)
    .maybeSingle();
  if (profile?.is_platform_admin) return true;

  const { data, error } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return Boolean(data);
}

export type RoleScope = {
  scope: string;
  siteId: string | null;
};

/** Pure helper — used by canAccessSite and unit tests. Never a substitute for RLS. */
export function siteInMemberScope(scopes: RoleScope[], siteId: string) {
  if (!scopes.length) return false;
  if (scopes.some((row) => row.scope === "organization" || row.scope === "platform")) {
    return true;
  }
  return scopes.some((row) => row.scope === "site" && row.siteId === siteId);
}

export async function canAccessSite(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  siteId: string,
) {
  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id")
    .eq("id", siteId)
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (siteError) throw new Error(siteError.message);
  if (!site) return false;

  const { data: member } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();
  if (!member) return false;

  const { data: roles, error } = await supabase
    .from("member_roles")
    .select("scope, site_id")
    .eq("member_id", member.id)
    .is("deleted_at", null);
  if (error) throw new Error(error.message);

  const scopes: RoleScope[] = (roles ?? []).map((row) => ({
    scope: row.scope,
    siteId: row.site_id,
  }));
  return siteInMemberScope(scopes, siteId);
}
