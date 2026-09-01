import { redirect } from "next/navigation";
import { Suspense } from "react";
import { OrgAdminSidebar } from "@/components/layout/org-admin-sidebar";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";
import { brandingCssVars } from "@/lib/branding/validate";
import OrgAdminLoading from "@/app/org-admin/loading";

export async function OrgAdminWorkspaceLoader({ children }: { children: React.ReactNode }) {
  const access = await requireOrgAdminAccess();
  if (!access.permitted) redirect("/app/home");

  const { data: orgSettings } = await access.supabase
    .from("organization_settings")
    .select("branding")
    .eq("organization_id", access.organization.id)
    .maybeSingle();

  const branding = (orgSettings?.branding ?? {}) as {
    primaryColor?: string;
    secondaryColor?: string;
  };
  const userLabel = access.profile?.full_name || access.profile?.email || access.user.email || "Admin";

  return (
    <div style={brandingCssVars(branding)}>
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <WorkspaceShell
        title="Organization Admin"
        userLabel={userLabel}
        sidebar={<OrgAdminSidebar organizationName={access.organization.name} />}
        signOut={<SignOutButton />}
      >
        <Suspense fallback={<OrgAdminLoading />}>{children}</Suspense>
      </WorkspaceShell>
    </div>
  );
}
