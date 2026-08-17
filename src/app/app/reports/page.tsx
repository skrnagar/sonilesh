import { ModuleShell } from "@/components/modules/module-shell";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { Badge } from "@/components/ui/badge";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ forceClosed?: string }>;
}) {
  const params = await searchParams;
  const access = await requireModuleAccess({
    featureCode: "advanced_reports",
    permission: "reports.view",
  });

  const forceOnly = params.forceClosed === "1";
  let query = access.supabase
    .from("ehs_events")
    .select("id, event_number, title, status, force_closed, force_close_reason, closed_at")
    .eq("organization_id", access.organization.id)
    .is("deleted_at", null)
    .order("closed_at", { ascending: false })
    .limit(50);
  if (forceOnly) query = query.eq("force_closed", true);

  const { data } = access.entitled && access.permitted ? await query : { data: [] };

  return (
    <ModuleShell
      title="Reports"
      description="Operational reports. Force-closures are flagged for audit."
      featureCode="advanced_reports"
      permission="reports.view"
    >
      <form className="flex items-center gap-2 text-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" name="forceClosed" value="1" defaultChecked={forceOnly} />
          Force-closed only
        </label>
        <button type="submit" className="rounded-md border border-border px-3 py-1">
          Apply
        </button>
      </form>
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {(data ?? []).map((row) => (
          <li key={row.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <span>
              {row.event_number} · {row.title || "Untitled"}
            </span>
            <span className="flex items-center gap-2">
              {row.force_closed ? <Badge variant="danger">Force-closed</Badge> : null}
              <span className="capitalize text-muted-foreground">{row.status}</span>
            </span>
          </li>
        ))}
        {!data?.length ? (
          <li className="px-4 py-8 text-center text-muted-foreground">No rows for this filter.</li>
        ) : null}
      </ul>
    </ModuleShell>
  );
}
