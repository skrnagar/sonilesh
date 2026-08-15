import { requirePlatformAdmin } from "@/lib/auth/session";

export default async function AdminPlansPage() {
  const { supabase } = await requirePlatformAdmin();
  const { data: plans } = await supabase
    .from("plans")
    .select("*, plan_features(count)")
    .order("sort_order");

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">Plan Management</h1>
      <p className="text-sm text-muted-foreground">
        Plans are database-driven. Application code never hard-codes plan names for entitlements.
      </p>
      <div className="overflow-x-auto border border-border bg-card">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-left">Code</th>
              <th className="px-3 py-2 text-left">Name</th>
              <th className="px-3 py-2 text-left">Monthly</th>
              <th className="px-3 py-2 text-left">Yearly</th>
              <th className="px-3 py-2 text-left">Public</th>
              <th className="px-3 py-2 text-left">Custom</th>
              <th className="px-3 py-2 text-left">Active</th>
            </tr>
          </thead>
          <tbody>
            {(plans ?? []).map((plan) => (
              <tr key={plan.id} className="border-t border-border">
                <td className="px-3 py-2 font-mono text-xs">{plan.code}</td>
                <td className="px-3 py-2">{plan.name}</td>
                <td className="px-3 py-2">${(plan.price_monthly_cents / 100).toFixed(2)}</td>
                <td className="px-3 py-2">${(plan.price_yearly_cents / 100).toFixed(2)}</td>
                <td className="px-3 py-2">{plan.is_public ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{plan.is_custom ? "Yes" : "No"}</td>
                <td className="px-3 py-2">{plan.is_active ? "Yes" : "No"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
