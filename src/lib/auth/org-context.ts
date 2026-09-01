import type { SupabaseClient } from "@supabase/supabase-js";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { hasFeature } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";
import { ORG_COOKIE, BUSINESS_UNIT_COOKIE, REGION_COOKIE, PROJECT_COOKIE, SITE_COOKIE } from "@/lib/auth/workspace-cookies";
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

/** Request-scoped BU/region/site/project lists for context switcher and scope filters. */
export const loadWorkspaceHierarchy = cache(
  async (supabase: SupabaseClient, organizationId: string) => {
    const [{ data: businessUnits }, { data: regions }, { data: sites }, { data: projects }] =
      await Promise.all([
        supabase
          .from("business_units")
          .select("id, name")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name")
          .limit(100),
        supabase
          .from("regions")
          .select("id, name, business_unit_id")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name")
          .limit(100),
        supabase
          .from("sites")
          .select("id, name, region_id, business_unit_id")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name")
          .limit(100),
        supabase
          .from("projects")
          .select("id, name, site_id, business_unit_id")
          .eq("organization_id", organizationId)
          .is("deleted_at", null)
          .order("name")
          .limit(100),
      ]);

    return {
      businessUnits: businessUnits ?? [],
      regions: regions ?? [],
      sites: sites ?? [],
      projects: projects ?? [],
    };
  },
);

/** Request-scoped: shares membership/org with layout + pages. */
export const requireOrgContext = cache(async () => {
  const { supabase, user, profile } = await requireUser();

  try {
    const jar = await cookies();
    const requestedOrgId = jar.get(ORG_COOKIE)?.value ?? null;
    const requestedBusinessUnitId = jar.get(BUSINESS_UNIT_COOKIE)?.value ?? null;
    const requestedRegionId = jar.get(REGION_COOKIE)?.value ?? null;
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

    const needWorkspaceLists =
      pathname.startsWith("/app") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/field");

    const hierarchy = needWorkspaceLists
      ? await loadWorkspaceHierarchy(supabase, organization.id)
      : { businessUnits: [], regions: [], sites: [], projects: [] };

    const { businessUnits, regions, sites, projects } = hierarchy;

    // Always org-validate workspace cookies — stale site/project ids caused field incident create to fail.
    const businessUnitId =
      requestedBusinessUnitId &&
      (businessUnits ?? []).some((bu) => bu.id === requestedBusinessUnitId)
        ? requestedBusinessUnitId
        : null;
    const regionId =
      requestedRegionId && (regions ?? []).some((region) => region.id === requestedRegionId)
        ? requestedRegionId
        : null;
    const siteId =
      requestedSiteId && (sites ?? []).some((site) => site.id === requestedSiteId)
        ? requestedSiteId
        : null;
    const projectId =
      requestedProjectId &&
      (projects ?? []).some((project) => project.id === requestedProjectId)
        ? requestedProjectId
        : null;

    return {
      supabase,
      user,
      profile,
      organization,
      membershipId: selected.id,
      organizations: orgOptions,
      businessUnits: businessUnits ?? [],
      regions: regions ?? [],
      sites: sites ?? [],
      projects: projects ?? [],
      businessUnitId,
      regionId,
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

/** Request-scoped: dedupes layout ModuleShell + page access checks. */
const resolveModuleAccess = cache(async (featureCode: string | null, permission: string | null) => {
  const ctx = await requireOrgContext();

  const checks: Promise<boolean>[] = [];
  if (featureCode) {
    checks.push(hasFeature(ctx.supabase, ctx.organization.id, featureCode));
  }
  if (permission) {
    checks.push(
      userHasPermission(ctx.supabase, ctx.organization.id, ctx.user.id, permission),
    );
  }

  if (!checks.length) {
    return { ...ctx, entitled: true as const, permitted: true as const };
  }

  const results = await Promise.all(checks);
  let i = 0;
  const entitled = featureCode ? results[i++] : true;
  const permitted = permission ? results[i++] : true;

  if (featureCode && !entitled) {
    return { ...ctx, entitled: false as const, permitted: false as const };
  }
  if (permission && !permitted) {
    return { ...ctx, entitled: true as const, permitted: false as const };
  }
  return { ...ctx, entitled: true as const, permitted: true as const };
});

export async function requireModuleAccess(opts: {
  featureCode?: string;
  permission?: string;
}) {
  return resolveModuleAccess(opts.featureCode ?? null, opts.permission ?? null);
}

/** Membership + feature + permission, or throw. Use in mutating server actions. */
export async function requireWriteAccess(opts: {
  featureCode?: string;
  permission: string;
}) {
  const access = await requireModuleAccess(opts);
  if (opts.featureCode && !access.entitled) {
    throw new Error("This module is not enabled for your plan.");
  }
  if (!access.permitted) {
    throw new Error(`Missing permission: ${opts.permission}`);
  }
  return access;
}
