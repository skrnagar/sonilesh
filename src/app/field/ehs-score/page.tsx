import { FieldEhsScoreDashboard } from "@/components/field/field-ehs-score-dashboard";
import { FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import {
  defaultEhsScoreBiFilters,
  loadEhsScoreBiDashboard,
} from "@/lib/services/ehs-score-bi";

export default async function FieldEhsScorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, "ehs_score")) return <FieldForbidden />;

  const access = await requireOrgContext();
  const params = await searchParams;

  const filters = defaultEhsScoreBiFilters(
    {
      businessUnitId: access.businessUnitId,
      regionId: access.regionId,
      projectId: access.projectId,
    },
    {
      businessUnitId: stringParam(params.businessUnitId),
      regionId: stringParam(params.regionId),
      projectId: stringParam(params.projectId),
      year: numberParam(params.year),
      month: numberParam(params.month),
    },
  );

  const dashboard = await loadEhsScoreBiDashboard(access.supabase, access.organization.id, {
    filters,
    businessUnits: access.businessUnits,
    regions: access.regions,
    sites: access.sites,
    projects: access.projects,
  });

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="BU/Region Wise EHS Score"
        subtitle={`EHS assessment, yearly trends, and status · ${dashboard.periodLabel}`}
      />
      <FieldEhsScoreDashboard
        dashboard={dashboard}
        businessUnits={access.businessUnits}
        regions={access.regions}
        sites={access.sites}
        projects={access.projects}
      />
    </div>
  );
}

function stringParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value || undefined;
}

function numberParam(value: string | string[] | undefined) {
  const raw = stringParam(value);
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}
