import { QuickCaptureForm } from "@/components/field/quick-report-form";
import { FieldCard, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { submitFieldReportAction } from "@/app/actions/field";
import { FIELD_LABELS } from "@/lib/field/labels";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { requireOrgContext } from "@/lib/auth/org-context";
import { loadReportFormContext } from "@/lib/reporting/form-context";

export default async function FieldIncidentPage() {
  const access = await requireOrgContext();
  const role = await resolveFieldRole(access.supabase, access.membershipId);
  if (!canFieldAction(role, "report_incident")) return <FieldForbidden />;

  const ctx = await loadReportFormContext(
    { ...access, entitled: true as const, permitted: true as const },
    "incident",
  );

  return (
    <div className="space-y-4">
      <FieldPageHeader title={FIELD_LABELS.incident.title} subtitle={FIELD_LABELS.incident.subtitle} />
      <FieldCard>
        <QuickCaptureForm
          mode="incident"
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
