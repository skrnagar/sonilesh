import { redirect } from "next/navigation";
import { QuickCaptureForm } from "@/components/field/quick-report-form";
import { FieldCard, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { submitFieldReportAction } from "@/app/actions/field";
import { canFieldAction } from "@/lib/auth/field-roles";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { requireOrgContext } from "@/lib/auth/org-context";

const TYPE_META: Record<string, { title: string; subtitle: string }> = {
  unsafe_act: {
    title: "Unsafe Act",
    subtitle: "Behaviour observation — photo, location, short note",
  },
  unsafe_condition: {
    title: "Unsafe Condition",
    subtitle: "Condition observation — photo, location, short note",
  },
  safety_observation: {
    title: "Safety Observation",
    subtitle: "Positive or improvement observation",
  },
  hazard: {
    title: "Hazard",
    subtitle: "Hazard to control — photo, location, short note",
  },
};

export default async function FieldHazardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "report_hazard")) return <FieldForbidden />;

  const params = await searchParams;
  // Legacy LMRA entry without type stays on dedicated /field/lmra UX.
  if (!params.type) redirect("/field/lmra");

  const type = ["unsafe_act", "unsafe_condition", "hazard", "safety_observation"].includes(
    params.type,
  )
    ? params.type
    : "hazard";

  const access = await requireOrgContext();
  const { data: sites } = await access.supabase
    .from("sites")
    .select("id, name")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("name");

  const meta = TYPE_META[type] ?? TYPE_META.hazard;

  return (
    <div className="space-y-4">
      <FieldPageHeader title={meta.title} subtitle={meta.subtitle} />
      <FieldCard>
        <QuickCaptureForm
          mode="observation"
          eventTypeCode={type}
          action={submitFieldReportAction}
          sites={sites ?? []}
          defaultSiteId={access.siteId ?? sites?.[0]?.id}
        />
      </FieldCard>
    </div>
  );
}
