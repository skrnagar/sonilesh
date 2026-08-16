import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { WorkspaceShell } from "@/components/layout/workspace-shell";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user } = await requirePlatformAdmin();
  const userLabel = profile?.full_name || user.email || "Admin";

  return (
    <WorkspaceShell
      title="SaaS Administration"
      userLabel={userLabel}
      sidebar={<AdminSidebar />}
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
