import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth/session";

async function loadUserPermissions(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  const { data: member, error: memberError } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .maybeSingle();

  if (memberError) throw new Error(memberError.message);
  if (!member) return [] as string[];

  const { data, error } = await supabase
    .from("member_roles")
    .select(
      `
      scope,
      site_id,
      roles:role_id (
        code,
        role_permissions (
          permissions:permission_id ( code )
        )
      )
    `,
    )
    .eq("member_id", member.id)
    .is("deleted_at", null);

  if (error) throw new Error(error.message);

  const codes = new Set<string>();
  for (const row of data ?? []) {
    const role = row.roles as unknown as {
      role_permissions?: Array<{ permissions?: { code?: string } | null }>;
    } | null;
    for (const rp of role?.role_permissions ?? []) {
      if (rp.permissions?.code) codes.add(rp.permissions.code);
    }
  }
  return Array.from(codes);
}

/** Request-scoped: one permissions fetch shared by layout + module gates. */
export const getCachedUserPermissions = cache(
  async (organizationId: string, userId: string) => {
    const supabase = await createClient();
    return loadUserPermissions(supabase, organizationId, userId);
  },
);

export async function getUserPermissions(
  _supabase: SupabaseClient,
  organizationId: string,
  userId: string,
) {
  return getCachedUserPermissions(organizationId, userId);
}

export async function requirePermission(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  permissionCode: string,
) {
  // Reuse request-cached profile (avoids an extra profiles round-trip).
  const { profile } = await requireUser();
  if (profile?.id === userId && profile.is_platform_admin) return true;

  const permissions = await getUserPermissions(supabase, organizationId, userId);
  if (!permissions.includes(permissionCode)) {
    throw new Error(`Missing permission: ${permissionCode}`);
  }
  return true;
}

export async function userHasPermission(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  permissionCode: string,
) {
  try {
    await requirePermission(supabase, organizationId, userId, permissionCode);
    return true;
  } catch {
    return false;
  }
}
