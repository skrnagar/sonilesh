import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { formatDate } from "@/lib/utils";
import Link from "next/link";

export default async function IntegrationMonitoringPage() {
  const access = await requireModuleAccess({
    featureCode: "integrations",
    permission: "integrations.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Integrations" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: jobs }, { data: errors }, { data: deliveries }] = await Promise.all([
    access.supabase
      .from("integration_sync_jobs")
      .select("id, mode, status, records_in, records_written, records_deduped, records_failed, created_at, finished_at, error")
      .eq("organization_id", access.organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
    access.supabase
      .from("integration_errors")
      .select("id, code, message, created_at, resolved_at")
      .eq("organization_id", access.organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
    access.supabase
      .from("integration_webhook_deliveries")
      .select("id, event_type, status, attempt_count, last_status_code, created_at, delivered_at")
      .eq("organization_id", access.organization.id)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/app/integrations" className="underline">
            Integration hub
          </Link>
        </p>
        <h1 className="text-xl font-semibold">Integration monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Sync jobs, error queue, and outbound webhook deliveries for this organization only.
        </p>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Recent sync jobs</h2>
        <MonitorTable
          headers={["Mode", "Status", "In / written / deduped / failed", "Finished", "Note"]}
          rows={(jobs ?? []).map((job) => [
            job.mode,
            job.status,
            `${job.records_in} / ${job.records_written} / ${job.records_deduped} / ${job.records_failed}`,
            formatDate(job.finished_at),
            job.error ?? "—",
          ])}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Error queue</h2>
        <MonitorTable
          headers={["Code", "Message", "Created", "Resolved"]}
          rows={(errors ?? []).map((row) => [
            row.code,
            row.message,
            formatDate(row.created_at),
            row.resolved_at ? formatDate(row.resolved_at) : "open",
          ])}
        />
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Webhook deliveries</h2>
        <MonitorTable
          headers={["Event", "Status", "Attempts", "HTTP", "Created"]}
          rows={(deliveries ?? []).map((row) => [
            row.event_type,
            row.status,
            String(row.attempt_count),
            row.last_status_code == null ? "—" : String(row.last_status_code),
            formatDate(row.created_at),
          ])}
        />
      </section>
    </div>
  );
}

function MonitorTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="min-w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-3 py-2">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={headers.length} className="px-3 py-8 text-center text-muted-foreground">
                None yet.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={i} className="border-t border-border">
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-2">
                    {cell}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
