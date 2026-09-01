import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { hasSupabaseConfig } from "@/lib/env";
import {
  formatSupabaseUserError,
  isNetworkFetchError,
  isNextRedirect,
  isSchemaMissingError,
  setupRedirectPath,
} from "@/lib/supabase/errors";
import type { Organization } from "@/types/database";
import {
  hasPlatformPermission,
  resolvePlatformRole,
  type PlatformPermission,
} from "@/lib/auth/platform";

const PROFILE_COLUMNS =
  "id, email, full_name, avatar_url, phone, is_platform_admin, platform_role, locale, timezone";

/** Request-scoped: dedupes auth+profile across layout and page. */
export const requireUser = cache(async () => {
  if (!hasSupabaseConfig()) {
    redirect("/login?error=supabase_not_configured");
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      if (isNetworkFetchError(authError) || isSchemaMissingError(authError)) {
        redirect(setupRedirectPath(authError));
      }
      redirect(
        `/login?error=${encodeURIComponent(formatSupabaseUserError(authError))}`,
      );
    }

    if (!user) redirect("/login");

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(PROFILE_COLUMNS)
      .eq("id", user.id)
      .maybeSingle();

    if (
      profileError &&
      profileError.message?.includes("platform_role")
    ) {
      const fallback = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, phone, is_platform_admin, locale, timezone")
        .eq("id", user.id)
        .maybeSingle();
      if (fallback.error && (isSchemaMissingError(fallback.error) || isNetworkFetchError(fallback.error))) {
        redirect(setupRedirectPath(fallback.error));
      }
      return { supabase, user, profile: fallback.data };
    }

    if (profileError && (isSchemaMissingError(profileError) || isNetworkFetchError(profileError))) {
      redirect(setupRedirectPath(profileError));
    }

    return { supabase, user, profile };
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    if (isNetworkFetchError(err) || isSchemaMissingError(err)) {
      redirect(setupRedirectPath(err));
    }
    throw err;
  }
});

export async function requirePlatformAdmin() {
  const ctx = await requireUser();
  if (!ctx.profile?.is_platform_admin) {
    redirect("/app/home");
  }
  const platformRole = resolvePlatformRole({
    isPlatformAdmin: ctx.profile.is_platform_admin,
    platformRole: (ctx.profile as { platform_role?: string | null }).platform_role,
  });
  return { ...ctx, platformRole };
}

export async function requirePlatformPermission(permission: PlatformPermission) {
  const ctx = await requirePlatformAdmin();
  if (!hasPlatformPermission(ctx.platformRole, permission)) {
    redirect("/admin");
  }
  return ctx;
}

export async function getActiveOrganization(
  organizationId?: string | null,
): Promise<{
  organization: Organization | null;
  membershipId: string | null;
}> {
  const { supabase, user } = await requireUser();

  const { data: memberships, error } = await supabase
    .from("organization_members")
    .select(
      "id, organization_id, organizations:organization_id(id, name, slug, status, onboarding_completed_at, industry, timezone, trial_ends_at)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .is("deleted_at", null);

  if (error && (isSchemaMissingError(error) || isNetworkFetchError(error))) {
    redirect(setupRedirectPath(error));
  }

  if (!memberships?.length) {
    return { organization: null, membershipId: null };
  }

  const selected =
    memberships.find((m) => m.organization_id === organizationId) ??
    memberships[0];

  return {
    organization: selected.organizations as unknown as Organization,
    membershipId: selected.id,
  };
}
