import { ModuleShell } from "@/components/modules/module-shell";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function JhaPage() {
  const access = await requireModuleAccess({ featureCode: "jha", permission: "risk.view" });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell title="JHA" description="Job Hazard Analysis" featureCode="jha" permission="risk.view" />
    );
  }

  const { data: type } = await access.supabase
    .from("risk_assessment_types")
    .select("id")
    .eq("code", "jha")
    .is("organization_id", null)
    .maybeSingle();

  const { data: rows } = type
    ? await access.supabase
        .from("risk_assessments")
        .select("assessment_number, title, status, assessment_date")
        .eq("organization_id", access.organization.id)
        .eq("assessment_type_id", type.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50)
    : { data: [] };

  return (
    <ModuleShell title="JHA" description="Job Hazard Analysis (shared risk engine)" featureCode="jha" permission="risk.view">
      <RecordsTable
        columns={["Number", "Title", "Status", "Date"]}
        empty="No JHA records yet."
        rows={(rows ?? []).map((r) => [
          r.assessment_number,
          r.title,
          <StatusPill key="s" value={r.status} />,
          r.assessment_date,
        ])}
      />
    </ModuleShell>
  );
}
