import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  getPermitMetrics,
  isExpiringSoon,
  listPermits,
  permitCountdown,
  permitValidityDisplay,
} from "@/lib/services/permits";

export default async function ActivePermitsBoardPage() {
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Permit to Work" />;
  if (!access.permitted) return <ForbiddenState />;

  const [rows, metrics] = await Promise.all([
    listPermits(access.supabase, access.organization.id, { activeBoard: true, limit: 100 }),
    getPermitMetrics(access.supabase, access.organization.id),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Active permit board</h1>
          <p className="text-sm text-muted-foreground">
            Live statuses use server time. Countdown is informational — expiry is enforced
            server-side.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/permits">All permits</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/permits/new">New permit</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Active", metrics.active],
          ["Pending approvals", metrics.pendingApprovals],
          ["Expiring soon", metrics.expiringSoon],
          ["Expired", metrics.expired],
          ["Suspended", metrics.suspended],
          ["Closed today", metrics.closedToday],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-2xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Permit</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Site</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Expiry</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                  No active / suspended / expired permits.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const c = permitCountdown(r.valid_to);
                const visual = permitValidityDisplay(r.status, r.valid_from, r.valid_to);
                const tone =
                  r.status === "suspended"
                    ? "danger"
                    : r.status === "expired" || isExpiringSoon(r.valid_to, 4)
                      ? "warning"
                      : "secondary";
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link
                        href={`/app/permits/${r.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {r.permit_number}
                      </Link>
                      <p className="text-xs text-muted-foreground">{r.title}</p>
                    </td>
                    <td className="px-3 py-2">
                      {(r.permit_types as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {(r.sites as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      {(r.locations as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2 capitalize">{r.residual_risk_band ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">{c?.label ?? "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={tone}>{visual}</Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
