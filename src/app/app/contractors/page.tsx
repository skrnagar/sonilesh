import Link from "next/link";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listContractorCompanies } from "@/lib/services/contractors";

export default async function ContractorsPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await listContractorCompanies(access.supabase, access.organization.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Contractor management</h1>
          <p className="text-sm text-muted-foreground">
            Register, prequalify, assign to sites, and track workforce readiness. Site approval is
            never global.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/contractors/export?kind=register">Export CSV</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/app/contractors/new">New contractor</Link>
          </Button>
        </div>
      </div>
      <ContractorsNav current="/app/contractors" />
      <RecordsTable
        columns={["Company", "Status", "Safety score", "Insurance", "City"]}
        empty="No contractors yet."
        rows={rows.map((row) => [
          <Link key={row.id} href={`/app/contractors/${row.id}`} className="font-medium hover:underline">
            {row.name}
          </Link>,
          <StatusPill key="s" value={row.status} />,
          row.safety_score ?? "—",
          row.insurance_expires_on ?? "—",
          row.city ?? "—",
        ])}
      />
    </div>
  );
}
