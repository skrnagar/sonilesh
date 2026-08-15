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
      <div className="overflow-x-auto border border-border bg-card">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-muted/70 text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Industry</th>
              <th className="px-3 py-2">Plan</th>
              <th className="px-3 py-2">Users</th>
              <th className="px-3 py-2">Sites</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Subscription</th>
              <th className="px-3 py-2">Created</th>
              <th className="px-3 py-2">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <Link href={`/admin/organizations/${org.id}`} className="font-medium text-accent">
                    {org.name}
                  </Link>
                </td>
                <td className="px-3 py-2">{org.industry ?? "—"}</td>
                <td className="px-3 py-2">{org.planName}</td>
                <td className="px-3 py-2">{org.users}</td>
                <td className="px-3 py-2">{org.sites}</td>
                <td className="px-3 py-2">
                  <Badge variant="secondary" className="capitalize">
                    {org.status}
                  </Badge>
                </td>
                <td className="px-3 py-2 capitalize">{org.subscriptionStatus}</td>
                <td className="px-3 py-2">{formatDate(org.created_at)}</td>
                <td className="px-3 py-2">{formatDate(org.last_activity_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
