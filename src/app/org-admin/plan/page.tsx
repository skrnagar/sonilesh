import Link from "next/link";
import { Button } from "@/components/ui/button";
import { requireOrgAdminAccess } from "@/lib/auth/org-admin";
import { listEnabledFeatures } from "@/lib/services/entitlements";

export default async function OrgAdminPlanPage() {
  const access = await requireOrgAdminAccess();
  const [enabledFeatures, { data: subscription }] = await Promise.all([
    listEnabledFeatures(access.supabase, access.organization.id),
    access.supabase
      .from("organization_subscriptions")
      .select("status, plan_id, plans(name, code)")
      .eq("organization_id", access.organization.id)
      .maybeSingle(),
  ]);

  const plan = subscription?.plans as { name?: string; code?: string } | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Plan</h1>
        <p className="text-sm text-muted-foreground">
          Subscription status and enabled modules for your organization.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Current plan</p>
          <p className="mt-1 text-lg font-semibold">{plan?.name ?? "Standard"}</p>
          <p className="text-sm text-muted-foreground capitalize">
            Status: {subscription?.status ?? "active"}
          </p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/app/settings/subscription">Manage subscription</Link>
          </Button>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Enabled modules</p>
          <p className="mt-1 text-3xl font-semibold tabular-nums">{enabledFeatures.length}</p>
          <Button asChild variant="outline" size="sm" className="mt-4">
            <Link href="/app/settings/billing">Billing details</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
