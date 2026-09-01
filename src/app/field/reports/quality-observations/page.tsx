import { QualityObservationsPanel } from "@/components/field/quality-observations-panel";
import { FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import {
  listQualityObservations,
  type QualityObservationFilters,
} from "@/lib/services/quality-observations";

export default async function FieldQualityObservationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "raksha_reports")) return <FieldForbidden />;

  const access = await requireOrgContext();
  const params = await searchParams;

  const initialFilters: QualityObservationFilters = {
    businessUnitId: stringParam(params.businessUnitId) ?? access.businessUnitId ?? undefined,
    regionId: stringParam(params.regionId) ?? access.regionId ?? undefined,
    projectId: stringParam(params.projectId) ?? access.projectId ?? undefined,
    fromDate: stringParam(params.fromDate),
    toDate: stringParam(params.toDate),
    serialNumber: stringParam(params.serialNumber),
    status: stringParam(params.status),
  };

  const rows = await listQualityObservations(
    access.supabase,
    access.organization.id,
    initialFilters,
  );

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="Observations / NCR / WSN"
        subtitle="Quality observations grouped by SBU, region, and project."
      />
      <QualityObservationsPanel
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
