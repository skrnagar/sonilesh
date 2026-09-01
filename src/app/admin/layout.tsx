import { Suspense } from "react";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { WorkspaceShellFallback } from "@/components/layout/workspace-shell-fallback";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import AppLoading from "@/app/app/loading";

async function AdminWorkspaceLoader({ children }: { children: React.ReactNode }) {
  const { profile, user, platformRole } = await requirePlatformAdmin();
  const userLabel = profile?.full_name || user.email || "Admin";

  return (
    <WorkspaceShell
      title="SaaS Administration"
      userLabel={userLabel}
      sidebar={<AdminSidebar platformRole={platformRole} />}
      signOut={
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm" className="w-full rounded-xl">
            Sign out
          </Button>
        </form>
      }
    >
      <Suspense fallback={<AppLoading />}>{children}</Suspense>
    </WorkspaceShell>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<WorkspaceShellFallback />}>
      <AdminWorkspaceLoader>{children}</AdminWorkspaceLoader>
    </Suspense>
  );
}
