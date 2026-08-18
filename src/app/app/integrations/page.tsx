import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { EmptyState, ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listHub } from "@/lib/integrations/service";
import { hubStatusForConnection } from "@/lib/integrations/sync";
import { connectorByCode } from "@/lib/integrations/catalog";
import { connectIntegrationAction, runSyncAction } from "@/app/actions/integrations";
import { formatDate } from "@/lib/utils";

export default async function IntegrationsHubPage() {
  const access = await requireModuleAccess({
    featureCode: "integrations",
    permission: "integrations.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Integrations" />;
  if (!access.permitted) return <ForbiddenState />;

  const hub = await listHub(access.supabase, access.organization.id);
  const buckets = {
    Available: hub.available,
    Connected: hub.connections.filter((c) => hubStatusForConnection(c) === "Connected"),
    "Needs Attention": hub.connections.filter((c) => hubStatusForConnection(c) === "Needs Attention"),
    Failed: hub.connections.filter((c) => hubStatusForConnection(c) === "Failed"),
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Integration hub</h1>
          <p className="text-sm text-muted-foreground">
            Provider-independent connections. Vendor adapters are sandbox or architecture-only unless
            marked real.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/integrations/monitoring">Monitoring</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/api">API keys</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(buckets).map(([label, items]) => (
          <div key={label} className="rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{items.length}</p>
          </div>
        ))}
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Available connectors</h2>
        {hub.available.length === 0 ? (
          <EmptyState title="All catalog connectors are connected" />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {hub.available.map((item) => {
              const meta = connectorByCode(item.code);
              return (
                <div key={item.code} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs uppercase text-muted-foreground">{meta?.maturity ?? item.maturity}</p>
                    </div>
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase">
                      {item.category}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                  {"id" in item && item.id ? (
                    <ActionForm action={connectIntegrationAction} className="mt-3 space-y-2">
                      <input type="hidden" name="integrationId" value={item.id} />
                      <input type="hidden" name="name" value={item.name} />
                      <input type="hidden" name="syncMode" value="manual" />
                      <Button type="submit" size="sm">
                        Connect
                      </Button>
                    </ActionForm>
                  ) : (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Catalog is code-only until the platform seed is applied.
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold">Connected</h2>
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Last sync</th>
                <th className="px-3 py-2">Records</th>
                <th className="px-3 py-2">Errors</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hub.connections.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                    No connections yet.
                  </td>
                </tr>
              ) : (
                hub.connections.map((row) => (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-3 py-2 font-medium">
                      {row.name}
                      <p className="text-xs text-muted-foreground">
                        {(row.integrations as { maturity?: string } | null)?.maturity ?? "sandbox"}
                      </p>
                    </td>
                    <td className="px-3 py-2">{hubStatusForConnection(row)}</td>
                    <td className="px-3 py-2">{formatDate(row.last_sync_at)}</td>
                    <td className="px-3 py-2">{row.records_synced}</td>
                    <td className="px-3 py-2">{row.error_count}</td>
                    <td className="px-3 py-2">
                      <ActionForm action={runSyncAction} className="flex gap-2">
                        <input type="hidden" name="connectionId" value={row.id} />
                        <input type="hidden" name="mode" value="manual" />
                        <Button type="submit" size="sm" variant="outline">
                          Sync now
                        </Button>
                      </ActionForm>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
