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
} from "@/lib/services/permits";

export default async function PermitsPage() {
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Permit to Work" />;
  if (!access.permitted) return <ForbiddenState />;

  const [rows, metrics, types] = await Promise.all([
    listPermits(access.supabase, access.organization.id, { limit: 80 }),
    getPermitMetrics(access.supabase, access.organization.id),
    access.supabase
      .from("permit_types")
      .select("code, name")
      .or(`organization_id.eq.${access.organization.id},organization_id.is.null`)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const expiringSoon = rows.filter(
    (p) => p.status === "active" && isExpiringSoon(p.valid_to, 24),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Permit to Work</h1>
          <p className="text-sm text-muted-foreground">
            Configurable types · risk-linked · checklist · isolation · approvals · close-out
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/permits/active">Active board</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <a href="/app/permits/export">Export CSV</a>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/ehs/permit-types">Configure types</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/permits/new">New permit</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          ["Active", metrics.active],
          ["Pending", metrics.pendingApprovals],
          ["Expiring", metrics.expiringSoon],
          ["Expired", metrics.expired],
          ["Suspended", metrics.suspended],
          ["Closed today", metrics.closedToday],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {expiringSoon.length ? (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
          <p className="font-semibold">Expiring within 24 hours</p>
          <ul className="mt-2 space-y-1 text-muted-foreground">
            {expiringSoon.map((p) => {
              const c = permitCountdown(p.valid_to);
              return (
                <li key={p.id}>
                  <Link href={`/app/permits/${p.id}`} className="text-accent hover:underline">
                    {p.permit_number}
                  </Link>{" "}
                  — {p.title} ({c?.label})
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Types: {(types.data ?? []).map((t) => t.name).join(", ")}
      </p>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Risk</th>
              <th className="px-3 py-2">Countdown</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No permits yet.{" "}
                  <Link href="/app/permits/new" className="text-accent underline">
                    Create one
                  </Link>
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const c = permitCountdown(r.valid_to);
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <Link
                        href={`/app/permits/${r.id}`}
                        className="font-medium text-accent hover:underline"
                      >
                        {r.permit_number}
                      </Link>
                    </td>
                    <td className="px-3 py-2">
                      {(r.permit_types as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">{r.title}</td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="capitalize">
                        {String(r.status).replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 capitalize">{r.residual_risk_band ?? "—"}</td>
                    <td className="px-3 py-2 tabular-nums">
                      {c ? (c.expired ? "Expired" : c.label) : "—"}
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
