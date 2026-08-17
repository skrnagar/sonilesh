import { cache } from "react";
import { fieldRoleFromCodes, type FieldRole } from "@/lib/auth/field-roles";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import { requireOrgContext } from "@/lib/auth/org-context";

/** Request-scoped: layout, home, and module pages share one role fetch. */
export const resolveFieldRole = cache(async function resolveFieldRole(
  _client?: unknown,
  _membershipId?: string,
): Promise<FieldRole> {
  void _client;
  void _membershipId;
  const { supabase, user, organization } = await requireOrgContext();
  const { roleCodes } = await getRoleCodesForUser(supabase, user.id, organization.id);
  return fieldRoleFromCodes(roleCodes);
});
