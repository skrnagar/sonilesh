import { requirePlatformAdmin } from "@/lib/auth/session";
import { EmptyState } from "@/components/shared/state-panels";

export default async function AdminUsagePage() {
  const { supabase } = await requirePlatformAdmin();
  const { data, error } = await supabase
    .from("usage_metrics")
    .select(
      "id, usage_value, period_start, period_end, organization_id, organizations:organization_id(name), features:feature_id(code, name)",
    )
    .order("period_start", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Usage</h1>
        <p className="text-sm text-muted-foreground">
          Metered usage by tenant and feature. Limits are enforced in the entitlement service.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
      {!data?.length ? (
        <EmptyState
          title="No usage metrics yet"
          description="Usage is recorded as tenants consume entitled modules."
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Organization</th>
                <th className="px-4 py-2.5">Feature</th>
                <th className="px-4 py-2.5">Value</th>
                <th className="px-4 py-2.5">Period</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const org = row.organizations as { name?: string } | null;
                const feature = row.features as { code?: string; name?: string } | null;
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-3">{org?.name ?? row.organization_id.slice(0, 8)}</td>
                    <td className="px-4 py-3">{feature?.name ?? feature?.code ?? "—"}</td>
                    <td className="px-4 py-3 tabular-nums">{row.usage_value}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {row.period_start} → {row.period_end}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
