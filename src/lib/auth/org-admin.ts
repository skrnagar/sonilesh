import { cache } from "react";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";

/** Organization admin portal: tenant_admin or platform staff only. */
export const requireOrgAdminAccess = cache(async () => {
  const ctx = await requireOrgContext();

  if (ctx.profile?.is_platform_admin) {
    return { ...ctx, permitted: true as const };
  }

  const { roleCodes } = await getRoleCodesForUser(
    ctx.supabase,
    ctx.user.id,
    ctx.organization.id,
  );

  if (roleCodes.includes("tenant_admin")) {
    return { ...ctx, permitted: true as const };
  }

  return { ...ctx, permitted: false as const };
});
