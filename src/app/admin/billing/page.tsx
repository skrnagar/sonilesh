import { requirePlatformPermission } from "@/lib/auth/session";

export default async function AdminBillingPage() {
  const { supabase } = await requirePlatformPermission("saas.billing.view");
  const { data: setting } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("key", "billing")
    .maybeSingle();
  const { data: invoices } = await supabase
    .from("invoices")
    .select("id, invoice_number, status, total_cents, organization_id, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-primary">Billing Configuration</h1>
      <div className="border border-border bg-card p-4 text-sm">
        <p className="font-medium">Provider config</p>
        <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(setting?.value ?? { provider: "manual" }, null, 2)}</pre>
        <p className="mt-3 text-muted-foreground">Checkout/payment provider integration is deferred; commercial terms and entitlements are already data-driven.</p>
      </div>
      <div className="border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Recent invoices</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {(invoices ?? []).map((invoice) => (
            <li key={invoice.id} className="flex justify-between border-b border-border py-1.5">
              <span>{invoice.invoice_number}</span>
              <span className="capitalize">{invoice.status} · ${(invoice.total_cents / 100).toFixed(2)}</span>
            </li>
          ))}
          {!invoices?.length ? <li className="text-muted-foreground">No invoices yet.</li> : null}
        </ul>
      </div>
    </div>
  );
}
