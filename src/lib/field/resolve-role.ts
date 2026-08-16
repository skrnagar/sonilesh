import type { SupabaseClient } from "@supabase/supabase-js";
import { fieldRoleFromCodes, type FieldRole } from "@/lib/auth/field-roles";

export async function resolveFieldRole(
  supabase: SupabaseClient,
  membershipId: string,
): Promise<FieldRole> {
  const { data: memberRoles } = await supabase
    .from("member_roles")
    .select("roles:role_id(code)")
    .eq("member_id", membershipId)
    .is("deleted_at", null);

  const codes = (memberRoles ?? [])
    .map((mr) => (mr.roles as { code?: string } | null)?.code)
    .filter(Boolean) as string[];
  return fieldRoleFromCodes(codes);
}
