import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { listOrganizationsAdmin } from "@/lib/services/admin";
import { formatDate } from "@/lib/utils";

export default async function AdminOrganizationsPage() {
  const { supabase } = await requirePlatformAdmin();
  const orgs = await listOrganizationsAdmin(supabase);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-primary">Organizations</h1>
        <p className="text-sm text-muted-foreground">
          Company, industry, plan, users, sites, status, subscription and activity.
        </p>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5">Company</th>
              <th className="px-4 py-2.5">Industry</th>
              <th className="px-4 py-2.5">Plan</th>
              <th className="px-4 py-2.5">Users</th>
              <th className="px-4 py-2.5">Sites</th>
              <th className="px-4 py-2.5">Status</th>
              <th className="px-4 py-2.5">Subscription</th>
              <th className="px-4 py-2.5">Created</th>
              <th className="px-4 py-2.5">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-t border-border hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link href={`/admin/organizations/${org.id}`} className="font-medium text-accent">
                    {org.name}
                  </Link>
                </td>
                <td className="px-4 py-3">{org.industry ?? "—"}</td>
                <td className="px-4 py-3">{org.planName}</td>
                <td className="px-4 py-3 tabular-nums">{org.users}</td>
                <td className="px-4 py-3 tabular-nums">{org.sites}</td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="capitalize">
                    {org.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 capitalize">{org.subscriptionStatus}</td>
                <td className="px-4 py-3 tabular-nums">{formatDate(org.created_at)}</td>
                <td className="px-4 py-3 tabular-nums">{formatDate(org.last_activity_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
