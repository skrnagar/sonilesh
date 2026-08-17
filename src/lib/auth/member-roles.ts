import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

export const getRoleCodesForUser = cache(async function getRoleCodesForUser(
  supabase: SupabaseClient,
  userId: string,
  organizationId?: string,
) {
  let memberQuery = supabase
    .from("organization_members")
    .select("id, organization_id")
    .eq("user_id", userId)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(1);

  if (organizationId) memberQuery = memberQuery.eq("organization_id", organizationId);

  const { data: member, error } = await memberQuery.maybeSingle();
  if (error) throw new Error(error.message);
  if (!member) return { organizationId: null as string | null, roleCodes: [] as string[] };

  const { data: memberRoles, error: roleError } = await supabase
    .from("member_roles")
    .select("roles:role_id(code)")
    .eq("member_id", member.id)
    .is("deleted_at", null);
  if (roleError) throw new Error(roleError.message);

  const roleCodes = (memberRoles ?? [])
    .map((row) => (row.roles as { code?: string } | null)?.code)
    .filter((code): code is string => Boolean(code));

  return { organizationId: member.organization_id as string, roleCodes };
});
