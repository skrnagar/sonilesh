import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { isEvidenceExpired } from "@/lib/compliance/applicability";

export default async function ExecutiveCompliancePage() {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const orgId = access.organization.id;
  const today = new Date().toISOString().slice(0, 10);
  const [tasks, licenses, assessments, findings] = await Promise.all([
    access.supabase
      .from("compliance_task_instances")
      .select("id, status, due_date")
      .eq("organization_id", orgId),
    access.supabase
      .from("regulatory_permits")
      .select("id, expires_on, status")
      .eq("organization_id", orgId),
    access.supabase
      .from("compliance_assessments")
      .select("id, status, findings_count")
      .eq("organization_id", orgId),
    access.supabase
      .from("checklist_findings")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .in("status", ["open", "capa_linked"]),
  ]);

  const overdue = (tasks.data ?? []).filter(
    (t) => t.due_date < today && ["open", "in_progress", "overdue"].includes(t.status),
  ).length;
  const expiredLicenses = (licenses.data ?? []).filter((l) => isEvidenceExpired(l.expires_on)).length;
  const assessmentFindings = (assessments.data ?? []).reduce((s, a) => s + (a.findings_count || 0), 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Executive compliance</h1>
        <p className="text-sm text-muted-foreground">
          Aggregations from this organization&apos;s filings, licenses, and assessments. Not a legal
          compliance certificate.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Open/overdue filings", value: overdue },
          { label: "Expired licenses", value: expiredLicenses },
          { label: "Assessment findings (recorded)", value: assessmentFindings },
          { label: "Open checklist findings", value: findings.count ?? 0 },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
