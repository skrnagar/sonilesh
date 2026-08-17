import Link from "next/link";
import { OrganizationsTable } from "@/components/admin/organizations-table";
import { Button } from "@/components/ui/button";
import { requirePlatformPermission } from "@/lib/auth/session";
import { canCreateOrganization, canSuspendOrganization } from "@/lib/auth/platform";
import { listOrganizationsAdmin } from "@/lib/services/admin";

export default async function AdminOrganizationsPage() {
  const { supabase, platformRole } = await requirePlatformPermission("saas.organizations.view");
  const orgs = await listOrganizationsAdmin(supabase);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Tenant companies. Access is authorized from the platform session, not from URL ids alone.
          </p>
        </div>
        {canCreateOrganization(platformRole) ? (
          <Button asChild>
            <Link href="/admin/organizations/new">Create organization</Link>
          </Button>
        ) : null}
      </div>
      <OrganizationsTable
        orgs={orgs.map((org) => ({
          id: org.id,
          name: org.name,
          industry: org.industry,
          status: org.status,
          created_at: org.created_at,
          last_activity_at: org.last_activity_at,
          users: org.users,
          sites: org.sites,
          planName: org.planName,
          subscriptionStatus: org.subscriptionStatus,
          mrrCents: org.mrrCents,
        }))}
        canManage={canSuspendOrganization(platformRole)}
      />
    </div>
  );
}
