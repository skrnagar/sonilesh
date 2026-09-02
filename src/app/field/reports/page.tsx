import { FieldContextStrip } from "@/components/field/field-context-strip";
import { FieldReportsHubLazy } from "@/components/field/field-reports-hub-lazy";
import { FieldForbidden } from "@/components/field/field-ui";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { reportsService } from "@/lib/field/services/reports";

export default async function FieldReportsPage() {
  const role = await resolveFieldRole();
  if (!canFieldAction(role, reportsService.fieldAction)) return <FieldForbidden />;

  const access = await requireOrgContext();
  const businessUnitName =
    access.businessUnits.find((bu) => bu.id === access.businessUnitId)?.name ?? "—";
  const regionName = access.regions.find((r) => r.id === access.regionId)?.name ?? "—";
  const projectName = access.projects.find((p) => p.id === access.projectId)?.name ?? "—";

  return (
    <div className="space-y-4">
      <FieldContextStrip
        userName={access.profile?.full_name ?? "—"}
        businessUnitName={businessUnitName}
        regionName={regionName}
        projectName={projectName}
        role={role}
        projectId={access.projectId}
        siteId={access.siteId}
        regionId={access.regionId}
        businessUnitId={access.businessUnitId}
      />
      <FieldReportsHubLazy role={role} />
    </div>
  );
}
