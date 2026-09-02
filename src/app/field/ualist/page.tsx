import { UaucListPanelLazy } from "@/components/field/uauc-list-panel-lazy";
import { FieldDemoBanner, FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { DEMO_UAUC_ROWS, withDemoFallback } from "@/lib/field/demo-fallback";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { listUaucEvents, type UaucListFilters } from "@/lib/field/services/uauc";

export default async function FieldUaucListPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "report_hazard")) return <FieldForbidden />;

  const access = await requireOrgContext();
  const params = await searchParams;

  const initialFilters: UaucListFilters = {
    businessUnitId: stringParam(params.businessUnitId) ?? access.businessUnitId ?? undefined,
    regionId: stringParam(params.regionId) ?? access.regionId ?? undefined,
    projectId: stringParam(params.projectId) ?? access.projectId ?? undefined,
    incidentType: stringParam(params.incidentType),
    status: stringParam(params.status),
    serialNumber: stringParam(params.serialNumber),
  };

  const rows = await listUaucEvents(access.supabase, access.organization.id);
  const { rows: displayRows, isDemoPreview } = withDemoFallback(
    rows,
    DEMO_UAUC_ROWS,
    access.organization.slug,
  );

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="Reported UA/UC/WSN List"
        subtitle="Unsafe acts, unsafe conditions, and work stop notices reported from the field."
      />
      {isDemoPreview ? <FieldDemoBanner /> : null}
      <UaucListPanelLazy
        rows={displayRows}
        businessUnits={access.businessUnits}
        regions={access.regions}
        projects={access.projects}
        initialFilters={initialFilters}
        isDemoPreview={isDemoPreview}
      />
    </div>
  );
}

function stringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}
