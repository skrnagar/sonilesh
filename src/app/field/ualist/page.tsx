import { UaucListPanel } from "@/components/field/uauc-list-panel";
import { FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { listUaucEvents, type UaucListFilters } from "@/lib/services/uauc-list";

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

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="Reported UA/UC/WSN List"
        subtitle="Unsafe acts, unsafe conditions, and work stop notices reported from the field."
      />
      <UaucListPanel
        rows={rows}
        businessUnits={access.businessUnits}
        regions={access.regions}
        projects={access.projects}
        initialFilters={initialFilters}
      />
    </div>
  );
}

function stringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}
