import Link from "next/link";
import {
  adminApplyDiscountAction,
  adminCancelSubscriptionAction,
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/shared/state-panels";
import { requirePlatformPermission } from "@/lib/auth/session";
import { canManageSubscription } from "@/lib/auth/platform";
import { formatDate } from "@/lib/utils";

export default async function AdminSubscriptionsPage() {
  const { supabase, platformRole } = await requirePlatformPermission("saas.subscriptions.view");
  const canManage = canManageSubscription(platformRole);
  const { data, error } = await supabase
    .from("subscriptions")
    .select(
      "id, status, billing_interval, current_period_start, current_period_end, created_at, custom_price_monthly_cents, discount_cents, final_price_cents, organization_id, organizations:organization_id(name), plans:plan_id(name, code, price_monthly_cents)",
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Subscriptions</h1>
        <p className="text-sm text-muted-foreground">
          Commercial terms. Payment capture is deferred; the BillingProvider abstraction is used for provider calls.
        </p>
      </div>
      {error ? <p className="text-sm text-destructive">{error.message}</p> : null}
      {!data?.length ? (
        <EmptyState title="No subscriptions yet" description="Created with each organization." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5">Organization</th>
                <th className="px-4 py-2.5">Plan</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Cycle</th>
                <th className="px-4 py-2.5">Price</th>
                <th className="px-4 py-2.5">Period</th>
                <th className="px-4 py-2.5">MRR</th>
                {canManage ? <th className="px-4 py-2.5">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => {
                const org = row.organizations as { name?: string } | null;
                const plan = row.plans as {
                  name?: string;
                  code?: string;
                  price_monthly_cents?: number;
                } | null;
                const price =
                  row.final_price_cents ??
                  row.custom_price_monthly_cents ??
                  plan?.price_monthly_cents ??
                  0;
                return (
                  <tr key={row.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/organizations/${row.organization_id}?tab=subscription`}
                        className="text-accent"
                      >
                        {org?.name ?? "—"}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{plan?.name ?? plan?.code ?? "—"}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {row.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 capitalize">{row.billing_interval}</td>
                    <td className="px-4 py-3 tabular-nums">${(price / 100).toFixed(2)}</td>
                    <td className="px-4 py-3 tabular-nums">
                      {formatDate(row.current_period_start)} → {formatDate(row.current_period_end)}
                    </td>
                    <td className="px-4 py-3 tabular-nums">${(price / 100).toFixed(0)}</td>
                    {canManage ? (
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <form action={adminApplyDiscountAction} className="flex gap-1">
                            <input type="hidden" name="subscriptionId" value={row.id} />
                            <Input name="discountCents" type="number" placeholder="Discount ¢" className="h-8 w-28" />
                            <Button type="submit" size="sm" variant="outline">
                              Discount
                            </Button>
                          </form>
                          <form action={adminCancelSubscriptionAction}>
                            <input type="hidden" name="subscriptionId" value={row.id} />
                            <input type="hidden" name="atPeriodEnd" value="true" />
                            <Button type="submit" size="sm" variant="outline">
                              Cancel at period end
                            </Button>
                          </form>
                        </div>
                      </td>
                    ) : null}
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
