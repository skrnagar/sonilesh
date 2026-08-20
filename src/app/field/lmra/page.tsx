import { QuickCaptureForm } from "@/components/field/quick-report-form";
import { FieldCard, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { submitFieldReportAction } from "@/app/actions/field";
import { FIELD_LABELS } from "@/lib/field/labels";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";

export default async function FieldLmraPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "report_hazard")) return <FieldForbidden />;
  const { type } = await searchParams;
  const reportType = ["hazard", "unsafe_act", "unsafe_condition", "safety_observation"].includes(
    type ?? "",
  )
    ? type
    : undefined;

  return (
    <div className="space-y-4">
      <FieldPageHeader title={FIELD_LABELS.lmra.title} subtitle={FIELD_LABELS.lmra.subtitle} />
      <FieldCard>
        <QuickCaptureForm mode="lmra" type={reportType} action={submitFieldReportAction} />
      </FieldCard>
    </div>
  );
}
