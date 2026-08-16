import { QuickCaptureForm } from "@/components/field/quick-report-form";
import { FieldCard, FieldPageHeader } from "@/components/field/field-ui";
import { submitFieldReportAction } from "@/app/actions/field";
import { FIELD_LABELS } from "@/lib/field/labels";
import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { ForbiddenState } from "@/components/shared/state-panels";

export default async function FieldLmraPage() {
  const { supabase, membershipId } = await requireOrgContext();
  const role = await resolveFieldRole(supabase, membershipId);
  if (!canFieldAction(role, "report_hazard")) return <ForbiddenState />;

  return (
    <div className="space-y-4">
      <FieldPageHeader title={FIELD_LABELS.lmra.title} subtitle={FIELD_LABELS.lmra.subtitle} />
      <FieldCard>
        <QuickCaptureForm mode="lmra" action={submitFieldReportAction} />
      </FieldCard>
    </div>
  );
}
