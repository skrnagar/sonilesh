import { cache } from "react";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasFeature } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";
import {
  isNetworkFetchError,
  isNextRedirect,
  isSchemaMissingError,
  setupRedirectPath,
} from "@/lib/supabase/errors";
import type { Organization } from "@/types/database";

const ORG_COLUMNS =
  "id, name, slug, status, onboarding_completed_at, industry, timezone, trial_ends_at";

/** Request-scoped: shares membership/org with layout + pages. */
export const requireOrgContext = cache(async () => {
  const { supabase, user, profile } = await requireUser();

  try {
    const { data: membership, error } = await supabase
      .from("organization_members")
      .select(`id, organization_id, organizations:organization_id(${ORG_COLUMNS})`)
      .eq("user_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(1)
      .maybeSingle();

    if (error && (isSchemaMissingError(error) || isNetworkFetchError(error))) {
      redirect(setupRedirectPath(error));
    }

    if (!membership) redirect("/onboarding");

    const organization = membership.organizations as unknown as Organization;
    return { supabase, user, profile, organization, membershipId: membership.id };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    if (isNetworkFetchError(err) || isSchemaMissingError(err)) {
      redirect(setupRedirectPath(err));
    }
    throw err;
  }
});

export async function requireModuleAccess(opts: {
  featureCode?: string;
  permission?: string;
}) {
  const ctx = await requireOrgContext();

  const checks: Promise<boolean>[] = [];
  if (opts.featureCode) {
    checks.push(hasFeature(ctx.supabase, ctx.organization.id, opts.featureCode));
  }
  if (opts.permission) {
    checks.push(
      userHasPermission(
        ctx.supabase,
        ctx.organization.id,
        ctx.user.id,
        opts.permission,
      ),
    );
  }

  if (!checks.length) {
    return { ...ctx, entitled: true as const, permitted: true as const };
  }

  const results = await Promise.all(checks);
  let i = 0;
  const entitled = opts.featureCode ? results[i++] : true;
  const permitted = opts.permission ? results[i++] : true;

  if (opts.featureCode && !entitled) {
    return { ...ctx, entitled: false as const, permitted: false as const };
  }
  if (opts.permission && !permitted) {
    return { ...ctx, entitled: true as const, permitted: false as const };
  }
  return { ...ctx, entitled: true as const, permitted: true as const };
}
