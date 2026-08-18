import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { ComplianceCalendarViews } from "@/components/compliance/compliance-calendar-views";
import { requireModuleAccess } from "@/lib/auth/org-context";
import type { CalendarEvent } from "@/lib/compliance/calendar";

export default async function ComplianceCalendarPage({
  searchParams,
}: {
  searchParams: Promise<{
    domain?: string;
    view?: string;
    site?: string;
    owner?: string;
    status?: string;
  }>;
}) {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const { domain, view, site, owner, status } = await searchParams;
  const calendarView = view === "week" || view === "list" ? view : "month";
  const orgId = access.organization.id;

  const [{ data: tasks }, { data: licenses }, { data: sites }] = await Promise.all([
    access.supabase
      .from("compliance_task_instances")
      .select(
        `
        id, period_label, due_date, status,
        org_applicable_compliances (
          owner_id, applicability_status,
          compliance_obligations (
            title, frequency,
            compliance_domains ( code, name )
          )
        )
      `,
      )
      .eq("organization_id", orgId)
      .neq("status", "cancelled")
      .order("due_date", { ascending: true })
      .limit(200),
    access.supabase
      .from("regulatory_permits")
      .select("id, name, expires_on, status, site_id")
      .eq("organization_id", orgId)
      .not("expires_on", "is", null)
      .order("expires_on")
      .limit(50),
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .order("name"),
  ]);

  const events: CalendarEvent[] = [];
  for (const task of tasks ?? []) {
    const nested = task.org_applicable_compliances as {
      owner_id?: string | null;
      applicability_status?: string;
      compliance_obligations?: {
        title?: string;
        compliance_domains?: { code?: string; name?: string } | null;
      } | null;
    } | null;
    if (nested?.applicability_status === "manually_excluded") continue;
    if (domain && nested?.compliance_obligations?.compliance_domains?.code !== domain) continue;
    if (owner && nested?.owner_id !== owner) continue;
    if (status && task.status !== status) continue;
    events.push({
      id: task.id,
      title: nested?.compliance_obligations?.title || "Filing",
      date: task.due_date,
      kind: "task",
      status: task.status,
      href: `/app/compliance/tasks/${task.id}`,
      ownerId: nested?.owner_id,
      category: nested?.compliance_obligations?.compliance_domains?.code,
      completed: ["filed", "verified"].includes(task.status),
    });
  }
  for (const row of licenses ?? []) {
    if (!row.expires_on) continue;
    if (site && row.site_id !== site) continue;
    if (status && row.status !== status) continue;
    events.push({
      id: row.id,
      title: row.name,
      date: row.expires_on,
      kind: "license",
      status: row.status,
      href: "/app/compliance/licenses",
      siteId: row.site_id,
      completed: ["surrendered"].includes(row.status),
    });
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Compliance calendar</h1>
        <p className="text-sm text-muted-foreground">
          Month, week, and list views of filings and license expiries. Green/amber/red are due-date
          tones, not a legal determination.
        </p>
      </div>
      <form className="flex flex-wrap gap-2 text-sm">
        <input type="hidden" name="view" value={calendarView} />
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
        <select name="site" defaultValue={site ?? ""} className="rounded-md border border-border bg-background px-2 py-1">
          <option value="">All sites</option>
          {(sites ?? []).map((row: { id: string; name: string }) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
        <select name="status" defaultValue={status ?? ""} className="rounded-md border border-border bg-background px-2 py-1">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="overdue">Overdue</option>
          <option value="filed">Filed</option>
        </select>
        <button className="underline" type="submit">
          Filter
        </button>
      </form>
      <ComplianceCalendarViews events={events} today={today} view={calendarView} />
    </div>
  );
}
