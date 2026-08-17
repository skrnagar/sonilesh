import { DynamicReportForm } from "@/components/events/dynamic-report-form";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { loadReportFormContext } from "@/lib/reporting/form-context";
import type { ReportTypeCode } from "@/lib/reporting/types";
import { REPORT_TYPE_META } from "@/lib/reporting/types";

export default async function NewHazardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const type = (
    ["hazard", "unsafe_act", "unsafe_condition", "safety_observation"].includes(
      params.type ?? "",
    )
      ? params.type
      : "hazard"
  ) as ReportTypeCode;

  const access = await requireModuleAccess({
    featureCode: "hazard_reporting",
    permission: "hazards.create",
  });
  if (!access.entitled) return <UpgradeState featureName="Hazard Reporting" />;
  if (!access.permitted) return <ForbiddenState />;
  const ctx = await loadReportFormContext(access, type);
  const meta = REPORT_TYPE_META[type];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Report {meta.label.toLowerCase()}</h1>
        <p className="text-sm text-muted-foreground">Dynamic fields for {meta.label}.</p>
      </div>
      <DynamicReportForm
        organizationId={access.organization.id}
        eventTypeCode={type}
        {...ctx}
      />
    </div>
  );
}
