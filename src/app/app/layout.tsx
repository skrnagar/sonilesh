import { redirect } from "next/navigation";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
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
        <div className="max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-[var(--shadow-md)]">
          <h1 className="text-lg font-semibold">Organization suspended</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Contact your administrator or SONIL EHS360 support.
          </p>
        </div>
      </div>
    );
  }

  const [enabledFeatures, permissions, overdueCapa] = await Promise.all([
    listEnabledFeatures(supabase, organization.id),
    getUserPermissions(supabase, organization.id, user.id),
    supabase
      .from("capa_items")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .lt("due_date", new Date().toISOString().slice(0, 10))
      .not("status", "in", '("closed","cancelled","verified")')
      .is("deleted_at", null),
  ]);

  const userLabel = profile?.full_name || profile?.email || user.email || "User";

  return (
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
      notificationCount={overdueCapa.count ?? 0}
      signOut={
        <form action={signOutAction}>
          <Button type="submit" variant="outline" size="sm" className="w-full rounded-xl">
            Sign out
          </Button>
        </form>
      }
    >
      {children}
    </WorkspaceShell>
  );
}
