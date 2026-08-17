import Link from "next/link";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { dueTone } from "@/lib/compliance/applicability";

export default async function ComplianceCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const { domain } = await searchParams;
  const { data: tasks } = await access.supabase
    .from("compliance_task_instances")
    .select(
      `
      id, period_label, due_date, status,
      org_applicable_compliances (
        applicability_status,
        compliance_obligations (
          title, frequency,
          compliance_domains ( code, name )
        )
      )
    `,
    )
    .eq("organization_id", access.organization.id)
    .neq("status", "cancelled")
    .order("due_date", { ascending: true })
    .limit(200);

  const { data: licenses } = await access.supabase
    .from("regulatory_permits")
    .select("id, name, expires_on, status")
    .eq("organization_id", access.organization.id)
    .not("expires_on", "is", null)
    .order("expires_on")
    .limit(50);

  const rows = (tasks ?? []).filter((task) => {
    const nested = task.org_applicable_compliances as {
      applicability_status?: string;
      compliance_obligations?: { compliance_domains?: { code?: string; name?: string } | null } | null;
    } | null;
    if (nested?.applicability_status === "manually_excluded") return false;
    if (domain && nested?.compliance_obligations?.compliance_domains?.code !== domain) return false;
    return true;
  });

  const toneClass = {
    green: "border-emerald-300 bg-emerald-50",
    amber: "border-amber-300 bg-amber-50",
    red: "border-red-300 bg-red-50",
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Compliance calendar</h1>
        <p className="text-sm text-muted-foreground">
          Green &gt;30 days, amber 7–30, red &lt;7 or overdue.
        </p>
      </div>
      <form className="flex gap-2 text-sm">
        <select name="domain" defaultValue={domain ?? ""} className="rounded-md border border-border bg-background px-2 py-1">
          <option value="">All domains</option>
          <option value="ehs">EHS</option>
          <option value="labour">Labour</option>
          <option value="secretarial">Secretarial</option>
          <option value="environmental">Environmental</option>
          <option value="esg_e">ESG Environmental</option>
          <option value="esg_s">ESG Social</option>
          <option value="esg_g">ESG Governance</option>
          <option value="tax">Tax</option>
        </select>
        <button className="underline" type="submit">
          Filter
        </button>
      </form>
      <ul className="space-y-2">
        {rows.map((task) => {
          const nested = task.org_applicable_compliances as {
            compliance_obligations?: {
              title?: string;
              compliance_domains?: { name?: string } | null;
            } | null;
          } | null;
          const tone = dueTone(task.due_date);
          return (
            <li key={task.id}>
              <Link
                href={`/app/compliance/tasks/${task.id}`}
                className={`block rounded-xl border px-4 py-3 ${toneClass[tone]}`}
              >
                <div className="flex justify-between gap-3">
                  <span className="font-medium">{nested?.compliance_obligations?.title}</span>
                  <span className="text-sm">{task.due_date}</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {nested?.compliance_obligations?.compliance_domains?.name} · {task.period_label} · {task.status}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
      {(licenses ?? []).length ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">License expiries (not PTW)</h2>
          <ul className="space-y-2">
            {(licenses ?? []).map((row) => (
              <li key={row.id}>
                <Link
                  href="/app/compliance/licenses"
                  className={`block rounded-xl border px-4 py-3 ${toneClass[dueTone(row.expires_on as string)]}`}
                >
                  <div className="flex justify-between gap-3">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-sm">{row.expires_on}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">License / consent · {row.status}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
