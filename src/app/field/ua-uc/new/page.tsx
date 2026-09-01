import { UaucReportForm } from "@/components/field/uauc-report-form";
import { FieldCard, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { submitFieldReportAction } from "@/app/actions/field";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { UAUC_EVENT_TYPES } from "@/lib/services/uauc-list";

async function loadCategoryGroups(
  supabase: Awaited<ReturnType<typeof requireOrgContext>>["supabase"],
  organizationId: string,
) {
  const { data: types } = await supabase
    .from("event_types")
    .select("id, code")
    .is("organization_id", null)
    .in("code", [...UAUC_EVENT_TYPES]);

  const groups = [];
  for (const type of types ?? []) {
    const { data: categories } = await supabase
      .from("event_categories")
      .select("id, name")
      .eq("organization_id", organizationId)
      .eq("event_type_id", type.id)
      .eq("is_active", true)
      .order("name")
      .limit(80);
    groups.push({ eventTypeCode: type.code, categories: categories ?? [] });
  }
  return groups;
}

export default async function FieldUaucNewPage() {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "report_hazard")) return <FieldForbidden />;

  const access = await requireOrgContext();
  const categoryGroups = await loadCategoryGroups(access.supabase, access.organization.id);

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="Unsafe Act / Unsafe Condition / WSN"
        subtitle="Report a safety observation from the field."
      />
      <FieldCard>
        <UaucReportForm
          action={submitFieldReportAction}
          businessUnits={access.businessUnits}
          regions={access.regions}
          projects={access.projects}
          categoryGroups={categoryGroups}
          defaultBusinessUnitId={access.businessUnitId}
          defaultRegionId={access.regionId}
          defaultProjectId={access.projectId}
          defaultSiteId={access.siteId}
        />
      </FieldCard>
    </div>
  );
}
