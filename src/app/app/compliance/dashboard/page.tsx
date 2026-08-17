import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { hasFeature } from "@/lib/services/entitlements";
import { isEvidenceExpired } from "@/lib/compliance/applicability";

export default async function ComplianceDashboardPage() {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const today = new Date().toISOString().slice(0, 10);
  const in30 = new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10);
  const yearAgo = new Date(Date.now() - 365 * 86400000).toISOString().slice(0, 10);
  const orgId = access.organization.id;

  const [overdue, upcoming, trailing, evidence, licenses, assessments, esgOk, legalOk] = await Promise.all([
    access.supabase
      .from("compliance_task_instances")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .lt("due_date", today)
      .in("status", ["open", "in_progress", "overdue"]),
    access.supabase
      .from("compliance_task_instances")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .gte("due_date", today)
      .lte("due_date", in30)
      .in("status", ["open", "in_progress"]),
    access.supabase
      .from("compliance_task_instances")
      .select("id, status, due_date, filed_date")
      .eq("organization_id", orgId)
      .gte("due_date", yearAgo),
    access.supabase
      .from("compliance_evidence")
      .select("id, task_instance_id, expires_at")
      .eq("organization_id", orgId),
    access.supabase
      .from("regulatory_permits")
      .select("id, expires_on, status")
      .eq("organization_id", orgId),
    access.supabase
      .from("compliance_assessments")
      .select("id, status")
      .eq("organization_id", orgId),
    hasFeature(access.supabase, orgId, "esg"),
    hasFeature(access.supabase, orgId, "legal_register"),
  ]);

  const trailingRows = trailing.data ?? [];
  const filedOnTime = trailingRows.filter(
    (row) =>
      (row.status === "filed" || row.status === "verified") &&
      row.filed_date &&
      row.filed_date <= row.due_date,
  ).length;
  const health = trailingRows.length ? Math.round((filedOnTime / trailingRows.length) * 100) : 0;
  const withEvidence = new Set((evidence.data ?? []).map((e) => e.task_instance_id)).size;
  const completeness = trailingRows.length ? Math.round((withEvidence / trailingRows.length) * 100) : 0;
  const expiredEvidence = (evidence.data ?? []).filter((row) => isEvidenceExpired(row.expires_at)).length;
  const expiredLicenses = (licenses.data ?? []).filter((row) => isEvidenceExpired(row.expires_on)).length;
  const openAssessments = (assessments.data ?? []).filter((row) =>
    ["draft", "in_progress"].includes(row.status),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Compliance health</h1>
        <p className="text-sm text-muted-foreground">
          Filing and license counts from this organization only. Expired evidence is flagged here and
          is not automatically a legal non-compliance finding.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "On-time filings (12 mo)", value: `${health}%` },
          { label: "Overdue filings", value: String(overdue.count ?? 0) },
          { label: "Due in 30 days", value: String(upcoming.count ?? 0) },
          { label: "Evidence completeness", value: `${completeness}%` },
          { label: "Expired evidence flags", value: String(expiredEvidence) },
          { label: "Expired licenses", value: String(expiredLicenses) },
          { label: "Open assessments", value: String(openAssessments) },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold">{card.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link className="underline" href="/app/compliance/calendar">
          Calendar
        </Link>
        <Link className="underline" href="/app/settings/compliance-profile">
          Applicability profile
        </Link>
        {legalOk ? (
          <Link className="underline" href="/app/compliance/legal-register">
            Legal register
          </Link>
        ) : null}
        <Link className="underline" href="/app/compliance/licenses">
          Licenses & consents
        </Link>
        {esgOk ? (
          <Link className="underline" href="/app/esg/dashboard">
            ESG dashboard
          </Link>
        ) : (
          <span className="text-muted-foreground">ESG is not enabled for this organization.</span>
        )}
      </div>
    </div>
  );
}
