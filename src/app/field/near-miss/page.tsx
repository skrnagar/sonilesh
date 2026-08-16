import { QuickCaptureForm } from "@/components/field/quick-report-form";
import { FieldCard, FieldPageHeader } from "@/components/field/field-ui";
import { submitFieldReportAction } from "@/app/actions/field";
import { FIELD_LABELS } from "@/lib/field/labels";
import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { ForbiddenState } from "@/components/shared/state-panels";

export default async function FieldNearMissPage() {
  const { supabase, membershipId } = await requireOrgContext();
  const role = await resolveFieldRole(supabase, membershipId);
  if (!canFieldAction(role, "report_near_miss")) return <ForbiddenState />;

  return (
    <div className="space-y-4">
      <FieldPageHeader title={FIELD_LABELS.nearMiss.title} subtitle={FIELD_LABELS.nearMiss.subtitle} />
      <FieldCard>
        <QuickCaptureForm mode="near-miss" action={submitFieldReportAction} />
      </FieldCard>
    </div>
  );
}
