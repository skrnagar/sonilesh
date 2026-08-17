import { fieldRoleFromCodes, type FieldRole } from "@/lib/auth/field-roles";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import { requireOrgContext } from "@/lib/auth/org-context";

/** Shares the request-scoped role fetch used by app/field layouts. */
export async function resolveFieldRole(
  _client?: unknown,
  _membershipId?: string,
): Promise<FieldRole> {
  void _client;
  void _membershipId;
  const { supabase, user, organization } = await requireOrgContext();
  const { roleCodes } = await getRoleCodesForUser(supabase, user.id, organization.id);
  return fieldRoleFromCodes(roleCodes);
}
