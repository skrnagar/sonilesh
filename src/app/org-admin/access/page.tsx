import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";

export default async function OrgAdminAccessPage() {
  await requireOrgAdminAccess();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-[length:var(--text-app-title)] font-semibold tracking-tight">Access</h1>
        <p className="text-sm text-muted-foreground">
          Role-based permissions are enforced server-side across all apps in your tenant.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        <p className="text-sm">
          Configure EHS module permissions, site scope, and role assignments in workspace settings.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/settings/users">Open user & role management</Link>
        </Button>
      </div>
    </div>
  );
}
