import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requireOrgContext } from "@/lib/auth/org-context";
import { getRoleCodesForUser } from "@/lib/auth/member-roles";
import { isContractorPortalOnly, isFieldOnlyRoles } from "@/lib/auth/personas";
import { listEnabledFeatures } from "@/lib/services/entitlements";
import { countUnreadNotifications } from "@/lib/services/notifications";
import { getUserPermissions } from "@/lib/services/rbac";
import { WorkspaceContextSwitchers } from "@/components/layout/workspace-context";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { brandingCssVars } from "@/lib/branding/validate";
import AppLoading from "@/app/app/loading";

export async function AppWorkspaceLoader({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile, organization, organizations, businessUnits, regions, sites, projects, businessUnitId, regionId, siteId, projectId } =
    await requireOrgContext();

  const { roleCodes } = await getRoleCodesForUser(supabase, user.id, organization.id);
  if (isContractorPortalOnly(roleCodes) && !profile?.is_platform_admin) {
    redirect("/contractor");
  }
  if (isFieldOnlyRoles(roleCodes) && !profile?.is_platform_admin) {
    redirect("/field/home");
  }

  if (!organization.onboarding_completed_at) {
    const { data: progress } = await supabase
      .from("organization_onboarding_progress")
      .select("current_step, completed_steps")
      .eq("organization_id", organization.id)
      .maybeSingle();
    const step = progress?.current_step ?? "review";
    if (step === "welcome" || step === "company") {
      redirect(`/onboarding?org=${organization.id}`);
    }
    if (step === "finish") {
      redirect(`/onboarding/review?org=${organization.id}`);
    }
    redirect(`/onboarding/${step}?org=${organization.id}`);
  }

  if (organization.status === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-md)]">
          <h1 className="text-lg font-semibold">Organization suspended</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact your administrator or SONIL EHS360 support.
          </p>
        </div>
      </div>
    );
  }

  const [enabledFeatures, permissions, { data: orgSettings }, notificationCount] =
    await Promise.all([
      listEnabledFeatures(supabase, organization.id),
      getUserPermissions(supabase, organization.id, user.id),
      supabase
        .from("organization_settings")
        .select("branding")
        .eq("organization_id", organization.id)
        .maybeSingle(),
      countUnreadNotifications(supabase, organization.id, user.id),
    ]);

  const userLabel = profile?.full_name || profile?.email || user.email || "User";
  const branding = (orgSettings?.branding ?? {}) as {
    primaryColor?: string;
    secondaryColor?: string;
  };
  const tenantStyle = brandingCssVars(branding);

  return (
    <div style={tenantStyle}>
      <NavigationProgress />
      <WorkspaceShell
        title="EHS Workspace"
        userLabel={userLabel}
        sidebar={
          <AppSidebar
            enabledFeatures={enabledFeatures}
            permissions={permissions}
            organizationName={organization.name}
          />
        }
        notificationCount={notificationCount}
        contextSlot={
          <WorkspaceContextSwitchers
            organizations={organizations}
            organizationId={organization.id}
            businessUnits={businessUnits}
            businessUnitId={businessUnitId}
            regions={regions}
            regionId={regionId}
            sites={sites}
            siteId={siteId}
            projects={projects}
            projectId={projectId}
          />
        }
        signOut={<SignOutButton />}
      >
        <Suspense fallback={<AppLoading />}>{children}</Suspense>
      </WorkspaceShell>
    </div>
  );
}
