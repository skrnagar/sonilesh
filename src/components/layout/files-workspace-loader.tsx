import { Suspense } from "react";
import { FilesSidebar } from "@/components/layout/files-sidebar";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NavigationProgress } from "@/components/layout/navigation-progress";
import { requireOrgContext } from "@/lib/auth/org-context";
import { brandingCssVars } from "@/lib/branding/validate";
import FilesLoading from "@/app/app/files/loading";

export async function FilesWorkspaceLoader({ children }: { children: React.ReactNode }) {
  const { profile, user, organization, supabase } = await requireOrgContext();

  const { data: orgSettings } = await supabase
    .from("organization_settings")
    .select("branding")
    .eq("organization_id", organization.id)
    .maybeSingle();

  const branding = (orgSettings?.branding ?? {}) as {
    primaryColor?: string;
    secondaryColor?: string;
  };
  const userLabel = profile?.full_name || profile?.email || user.email || "User";

  return (
    <div style={brandingCssVars(branding)}>
      <NavigationProgress />
      <WorkspaceShell
        title="Files & Data"
        userLabel={userLabel}
        sidebar={<FilesSidebar organizationName={organization.name} />}
        signOut={<SignOutButton />}
      >
        <Suspense fallback={<FilesLoading />}>{children}</Suspense>
      </WorkspaceShell>
    </div>
  );
}
