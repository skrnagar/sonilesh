import Link from "next/link";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getContractorDashboard } from "@/lib/services/contractors";

export default async function ContractorDashboardPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const dash = await getContractorDashboard(access.supabase, access.organization.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Contractor dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Status mix, document expiry, and pending site access. PTW enforcement is{" "}
            {dash.settings.ptw_enforce_readiness ? "on" : "off"}.
          </p>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/contractors/export?kind=expiry">Expiry CSV</Link>
        </Button>
      </div>
      <ContractorsNav current="/app/contractors/dashboard" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Companies", dash.total],
          ["Active / approved", dash.byStatus.active],
          ["Pending", dash.byStatus.pending],
          ["Blacklisted", dash.byStatus.blacklisted],
          ["Expiring docs (30d)", dash.expiringDocuments],
          ["Expired docs", dash.expiredDocuments],
          ["Pending site access", dash.pendingAccess],
          ["Suspended", dash.byStatus.suspended],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Pass / conditional prequal thresholds:{" "}
        {dash.settings.prequal_pass_percent ?? "not set"} /{" "}
        {dash.settings.prequal_conditional_percent ?? "not set"} (configure in settings — not
        hard-coded).
      </p>
    </div>
  );
}
