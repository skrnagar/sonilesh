import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, user } = await requirePlatformAdmin();

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="app-shell-header sticky top-0 z-10 flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <p className="text-sm font-semibold tracking-tight">SaaS Administration</p>
            <p className="text-xs text-muted-foreground">
              {profile?.full_name || user.email}
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
