import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listExpiringItems, loadExpiryWarningDays } from "@/lib/services/expiry";
import { formatDate } from "@/lib/utils";

export default async function ExpiryAggregatorPage() {
  const access = await requireModuleAccess({ permission: "documents.view" });
  if (!access.permitted) return <ForbiddenState />;

  const days = await loadExpiryWarningDays(access.supabase, access.organization.id);
  const items = await listExpiringItems(access.supabase, access.organization.id, days);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Expiry register</h1>
        <p className="text-sm text-muted-foreground">
          Documents, SDS, PPE, contractor files, and training. Warning window is {days} days (organization
          setting — not a hard-coded 30).
        </p>
      </div>
      {!access.entitled ? <UpgradeState featureName="Related modules" /> : null}
      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Kind</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Expires</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  Nothing expiring in the configured window.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={`${item.kind}-${item.id}`} className="border-t border-border">
                  <td className="px-3 py-2 capitalize">{item.kind.replace(/_/g, " ")}</td>
                  <td className="px-3 py-2">
                    <Link href={item.href} className="text-accent hover:underline">
                      {item.title}
                    </Link>
                    {item.subtitle ? (
                      <span className="block text-xs text-muted-foreground">{item.subtitle}</span>
                    ) : null}
                  </td>
                  <td className="px-3 py-2">{formatDate(item.expiresOn)}</td>
                  <td className="px-3 py-2 capitalize">{item.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
