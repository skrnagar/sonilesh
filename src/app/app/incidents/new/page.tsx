import { DynamicReportForm } from "@/components/events/dynamic-report-form";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { loadReportFormContext } from "@/lib/reporting/form-context";
import { REPORT_TYPE_META } from "@/lib/reporting/types";

export default async function NewIncidentPage() {
  const access = await requireModuleAccess({
    featureCode: "incident_management",
    permission: "incidents.create",
  });
  if (!access.entitled) return <UpgradeState featureName="Incidents" />;
  if (!access.permitted) return <ForbiddenState />;

  const ctx = await loadReportFormContext(access, "incident");
  const meta = REPORT_TYPE_META.incident;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Report {meta.label.toLowerCase()}</h1>
        <p className="text-sm text-muted-foreground">
          Shared reporting engine with numbering, duplicate warnings, and audit trail.
        </p>
      </div>
      <DynamicReportForm
        organizationId={access.organization.id}
        eventTypeCode="incident"
        sites={ctx.sites}
        projects={ctx.projects}
        departments={ctx.departments}
        locations={ctx.locations}
        severities={ctx.severities}
        categories={ctx.categories}
        customFields={ctx.customFields}
      />
    </div>
  );
}
