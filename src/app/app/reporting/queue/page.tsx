import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

export default async function ReportingQueuePage() {
  const access = await requireModuleAccess({
    featureCode: "incident_management",
    permission: "incidents.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Incidents" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: queue }, { data: overdueCapa }, { data: dueAudits }] = await Promise.all([
    access.supabase
      .from("ehs_events")
      .select(
        "id, event_number, title, status, occurred_at, event_types:event_type_id(code, name), severity_levels:severity_id(name)",
      )
      .eq("organization_id", access.organization.id)
      .in("status", ["submitted", "triage", "investigation"])
      .is("deleted_at", null)
      .order("occurred_at", { ascending: false })
      .limit(50),
    access.supabase
      .from("capa_items")
      .select("id, title, due_date, status, owner_id")
      .eq("organization_id", access.organization.id)
      .lt("due_date", new Date().toISOString().slice(0, 10))
      .not("status", "in", '("closed","cancelled","verified")')
      .is("deleted_at", null)
      .limit(20),
    access.supabase
      .from("checklist_assignments")
      .select("id, due_date, status, title, checklist_type")
      .eq("organization_id", access.organization.id)
      .eq("assignee_id", access.user.id)
      .in("status", ["assigned", "in_progress", "scheduled"])
      .is("deleted_at", null)
      .limit(20),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Reporting queue</h1>
        <p className="text-sm text-muted-foreground">
          Triage new reports, pick up investigations, and clear overdue CAPA. Settings stay out of
          this view.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Inbox</h2>
        <ul className="mt-3 divide-y divide-border">
          {(queue ?? []).map((row) => {
            const type = row.event_types as { code?: string; name?: string } | null;
            const href =
              type?.code === "near_miss"
                ? `/app/near-misses/${row.id}`
                : type?.code === "incident"
                  ? `/app/incidents/${row.id}`
                  : `/app/hazards/${row.id}`;
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="text-sm font-medium">
                    {row.event_number} · {row.title || "Untitled"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {type?.name ?? type?.code} · {formatDate(row.occurred_at)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize">
                    {row.status}
                  </Badge>
                  <Button asChild size="sm">
                    <Link href={href}>Open</Link>
                  </Button>
                </div>
              </li>
            );
          })}
          {!queue?.length ? (
            <li className="py-8 text-center text-sm text-muted-foreground">
              No reports waiting in submitted, triage, or investigation.
            </li>
          ) : null}
        </ul>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Overdue CAPA</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(overdueCapa ?? []).map((item) => (
              <li key={item.id} className="flex justify-between gap-2 border-b border-border py-2">
                <span>{item.title}</span>
                <span className="text-xs text-destructive">due {item.due_date}</span>
              </li>
            ))}
            {!overdueCapa?.length ? (
              <li className="text-muted-foreground">No overdue CAPA.</li>
            ) : null}
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Assigned inspections / audits</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(dueAudits ?? []).map((item) => (
              <li key={item.id} className="border-b border-border py-2">
                {item.title} · {item.checklist_type} · {item.status}
              </li>
            ))}
            {!dueAudits?.length ? (
              <li className="text-muted-foreground">Nothing assigned to you.</li>
            ) : null}
          </ul>
        </section>
      </div>
    </div>
  );
}
