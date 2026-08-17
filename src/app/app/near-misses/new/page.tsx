import { DynamicReportForm } from "@/components/events/dynamic-report-form";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { loadReportFormContext } from "@/lib/reporting/form-context";

export default async function NewNearMissPage() {
  const access = await requireModuleAccess({
    featureCode: "near_miss",
    permission: "near_miss.create",
  });
  if (!access.entitled) return <UpgradeState featureName="Near Miss" />;
  if (!access.permitted) return <ForbiddenState />;
  const ctx = await loadReportFormContext(access, "near_miss");

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Report near miss</h1>
        <p className="text-sm text-muted-foreground">
          Same engine as incidents — no duplicate data model.
        </p>
      </div>
      <DynamicReportForm
        organizationId={access.organization.id}
        eventTypeCode="near_miss"
        {...ctx}
      />
    </div>
  );
}
