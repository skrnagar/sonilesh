import { QuickCaptureForm } from "@/components/field/quick-report-form";
import { FieldCard, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { submitFieldReportAction } from "@/app/actions/field";
import { FIELD_LABELS } from "@/lib/field/labels";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { requireOrgContext } from "@/lib/auth/org-context";
import { loadReportFormContext } from "@/lib/reporting/form-context";

export default async function FieldNearMissPage() {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "report_near_miss")) return <FieldForbidden />;

  const access = await requireOrgContext();
  const ctx = await loadReportFormContext(
    { ...access, entitled: true as const, permitted: true as const },
    "near_miss",
  );

  return (
    <div className="space-y-4">
      <FieldPageHeader title={FIELD_LABELS.nearMiss.title} subtitle={FIELD_LABELS.nearMiss.subtitle} />
      <FieldCard>
        <QuickCaptureForm
          mode="near-miss"
          action={submitFieldReportAction}
          sites={ctx.sites}
          severities={ctx.severities}
          categories={ctx.categories}
          defaultSiteId={access.siteId ?? ctx.sites[0]?.id}
        />
      </FieldCard>
    </div>
  );
}
