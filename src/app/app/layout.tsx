import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { requireOrgContext } from "@/lib/auth/org-context";
import { listEnabledFeatures } from "@/lib/services/entitlements";
import { getUserPermissions } from "@/lib/services/rbac";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { supabase, user, profile, organization } = await requireOrgContext();

  if (!organization.onboarding_completed_at) {
    redirect(`/onboarding/plan?org=${organization.id}`);
  }

  if (organization.status === "suspended") {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold">Organization suspended</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact your administrator or EHS360 support.
          </p>
        </div>
      </div>
    );
  }

  const [enabledFeatures, permissions] = await Promise.all([
    listEnabledFeatures(supabase, organization.id),
    getUserPermissions(supabase, organization.id, user.id),
  ]);

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar
        enabledFeatures={enabledFeatures}
        permissions={permissions}
        organizationName={organization.name}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-shell-header sticky top-0 z-10 flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-sm font-semibold tracking-tight text-foreground">
              EHS Workspace
            </p>
            <p className="text-xs text-muted-foreground">
              {profile?.full_name || profile?.email || user.email}
            </p>
          </div>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" size="sm">
              Sign out
            </Button>
          </form>
        </header>
        <main className="flex-1 overflow-auto p-5 md:p-6">{children}</main>
      </div>
    </div>
  );
}
