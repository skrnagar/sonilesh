import { requireModuleAccess } from "@/lib/auth/org-context";
import { ForbiddenState } from "@/components/shared/state-panels";
import { isSelfHosted } from "@/lib/env";
import { Button } from "@/components/ui/button";
import { requestPlanChangeAction } from "@/app/actions/billing";

export default async function BillingSettingsPage() {
  const access = await requireModuleAccess({ permission: "billing.view" });
  if (!access.permitted) return <ForbiddenState />;

  if (isSelfHosted()) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">License</h1>
        <p className="text-sm text-muted-foreground">
          This instance is self-hosted. Module access is controlled by the signed license /
          SELF_HOST_FEATURE_CODES, not in-app checkout.
        </p>
      </div>
    );
  }

  const [{ data: subscription }, { data: plans }] = await Promise.all([
    access.supabase
      .from("subscriptions")
      .select("id, status, billing_interval, plan_id, current_period_end, plans:plan_id(code, name)")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .maybeSingle(),
    access.supabase
      .from("plans")
      .select("id, code, name, price_monthly_cents, is_public")
      .eq("is_public", true)
      .eq("is_active", true)
      .order("sort_order"),
  ]);

  const plan = subscription?.plans as { code?: string; name?: string } | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Upgrades apply immediately. Downgrades take effect at the next billing period so you do
          not lose mid-cycle access.
        </p>
      </div>
      <section className="rounded-2xl border border-border bg-card p-5 text-sm">
        <p>
          Current plan: <strong>{plan?.name ?? plan?.code ?? "None"}</strong>
        </p>
        <p className="mt-1 capitalize text-muted-foreground">
          Status {subscription?.status ?? "—"}
          {subscription?.current_period_end
            ? ` · period ends ${new Date(subscription.current_period_end).toLocaleDateString()}`
            : ""}
        </p>
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        {(plans ?? []).map((p) => (
            <form
            key={p.id}
            action={requestPlanChangeAction}
            className="rounded-2xl border border-border bg-card p-4"
          >
            <input type="hidden" name="planId" value={p.id} />
            <h2 className="font-semibold">{p.name}</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              ${(p.price_monthly_cents / 100).toFixed(0)} / month
            </p>
            <Button type="submit" className="mt-4 w-full" variant="outline">
              {p.id === subscription?.plan_id ? "Current plan" : "Select plan"}
            </Button>
          </form>
        ))}
      </div>
    </div>
  );
}
