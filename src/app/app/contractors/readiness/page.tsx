import Link from "next/link";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  getCompanyReadiness,
  listContractorCompanies,
  TRAINING_READINESS_TODO,
} from "@/lib/services/contractors";

export default async function ContractorReadinessPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const companies = await listContractorCompanies(access.supabase, access.organization.id);
  const readiness = await Promise.all(
    companies.slice(0, 40).map(async (c) => ({
      company: c,
      result: await getCompanyReadiness(access.supabase, {
        organizationId: access.organization.id,
        companyId: c.id,
      }),
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Readiness</h1>
        <p className="text-sm text-muted-foreground">{TRAINING_READINESS_TODO}</p>
      </div>
      <ContractorsNav current="/app/contractors/readiness" />
      <RecordsTable
        columns={["Company", "Status", "Ready", "Gaps"]}
        empty="No contractors to evaluate."
        rows={readiness.map(({ company, result }) => [
          <Link key={company.id} href={`/app/contractors/${company.id}?tab=readiness`} className="underline">
            {company.name}
          </Link>,
          <StatusPill key="s" value={company.status} />,
          result.ready ? "Yes" : "No",
          result.gaps.map((g) => g.message).join("; ") || "—",
        ])}
      />
    </div>
  );
}
