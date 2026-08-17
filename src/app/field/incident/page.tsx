import { QuickCaptureForm } from "@/components/field/quick-report-form";
import { FieldCard, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { submitFieldReportAction } from "@/app/actions/field";
import { FIELD_LABELS } from "@/lib/field/labels";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";

export default async function FieldIncidentPage() {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "report_incident")) return <FieldForbidden />;

  return (
    <div className="space-y-4">
      <FieldPageHeader title={FIELD_LABELS.incident.title} subtitle={FIELD_LABELS.incident.subtitle} />
      <FieldCard>
        <QuickCaptureForm mode="incident" action={submitFieldReportAction} />
      </FieldCard>
    </div>
  );
}
