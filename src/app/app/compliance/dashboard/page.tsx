import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { hasFeature } from "@/lib/services/entitlements";

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

  const [overdue, upcoming, trailing, evidence, esgOk] = await Promise.all([
    access.supabase
      .from("compliance_task_instances")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", access.organization.id)
      .lt("due_date", today)
      .in("status", ["open", "in_progress", "overdue"]),
    access.supabase
      .from("compliance_task_instances")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", access.organization.id)
      .gte("due_date", today)
      .lte("due_date", in30)
      .in("status", ["open", "in_progress"]),
    access.supabase
      .from("compliance_task_instances")
      .select("id, status, due_date, filed_date")
      .eq("organization_id", access.organization.id)
      .gte("due_date", yearAgo),
    access.supabase
      .from("compliance_evidence")
      .select("id, task_instance_id")
      .eq("organization_id", access.organization.id),
    hasFeature(access.supabase, access.organization.id, "esg_reporting"),
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Compliance health</h1>
        <p className="text-sm text-muted-foreground">
          Executive view for Company Secretary / Compliance Officer. Filing proof lives on each task.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "On-time filings (12 mo)", value: `${health}%` },
          { label: "Overdue", value: String(overdue.count ?? 0) },
          { label: "Due in 30 days", value: String(upcoming.count ?? 0) },
          { label: "Evidence completeness", value: `${completeness}%` },
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
        {esgOk ? (
          <Link className="underline" href="/app/esg/brsr-report">
            BRSR report
          </Link>
        ) : (
          <span className="text-muted-foreground">
            ESG / BRSR is a Professional+ module.{" "}
            <Link className="underline" href="/app/settings/billing">
              Upgrade
            </Link>
          </span>
        )}
      </div>
    </div>
  );
}
