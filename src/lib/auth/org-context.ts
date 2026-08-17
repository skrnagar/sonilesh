import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasFeature } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";
import { ORG_COOKIE, PROJECT_COOKIE, SITE_COOKIE } from "@/lib/auth/workspace-cookies";
import {
  isNetworkFetchError,
  isNextRedirect,
  isSchemaMissingError,
  setupRedirectPath,
} from "@/lib/supabase/errors";
import type { Organization } from "@/types/database";

const ORG_COLUMNS =
  "id, name, slug, status, onboarding_completed_at, industry, timezone, trial_ends_at";

export type OrgOption = { id: string; name: string; membershipId: string };

/** Request-scoped: shares membership/org with layout + pages. */
export const requireOrgContext = cache(async () => {
  const { supabase, user, profile } = await requireUser();

  try {
    const jar = await cookies();
    const requestedOrgId = jar.get(ORG_COOKIE)?.value ?? null;
    const requestedSiteId = jar.get(SITE_COOKIE)?.value ?? null;
    const requestedProjectId = jar.get(PROJECT_COOKIE)?.value ?? null;
    const pathname = (await headers()).get("x-ehs-pathname") ?? "";

    const { data: memberships, error } = await supabase
      .from("organization_members")
      .select(`id, organization_id, organizations:organization_id(${ORG_COLUMNS})`)
      .eq("user_id", user.id)
      .eq("status", "active")
      .is("deleted_at", null);

    if (error && (isSchemaMissingError(error) || isNetworkFetchError(error))) {
      redirect(setupRedirectPath(error));
    }

    if (!memberships?.length) redirect("/onboarding");

    const selected =
      memberships.find((row) => row.organization_id === requestedOrgId) ?? memberships[0];

    const organization = selected.organizations as unknown as Organization;

    const orgOptions: OrgOption[] = memberships.map((row) => {
      const org = row.organizations as unknown as Organization;
      return { id: org.id, name: org.name, membershipId: row.id };
    });

    const needWorkspaceLists = pathname.startsWith("/app") || pathname.startsWith("/admin");

    const [{ data: sites }, { data: projects }] = needWorkspaceLists
      ? await Promise.all([
          supabase
            .from("sites")
            .select("id, name")
            .eq("organization_id", organization.id)
            .is("deleted_at", null)
            .order("name")
            .limit(100),
          supabase
            .from("projects")
            .select("id, name, site_id")
            .eq("organization_id", organization.id)
            .is("deleted_at", null)
            .order("name")
            .limit(100),
        ])
      : [
          { data: [] as Array<{ id: string; name: string }> },
          { data: [] as Array<{ id: string; name: string; site_id: string | null }> },
        ];

    const siteId =
      requestedSiteId &&
      (!needWorkspaceLists || (sites ?? []).some((site) => site.id === requestedSiteId))
        ? requestedSiteId
        : null;
    const projectId =
      requestedProjectId &&
      (!needWorkspaceLists ||
        (projects ?? []).some((project) => project.id === requestedProjectId))
        ? requestedProjectId
        : null;

    return {
      supabase,
      user,
      profile,
      organization,
      membershipId: selected.id,
      organizations: orgOptions,
      sites: sites ?? [],
      projects: projects ?? [],
      siteId,
      projectId,
    };
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
