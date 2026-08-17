import Link from "next/link";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { ForbiddenState } from "@/components/shared/state-panels";
import { Button } from "@/components/ui/button";
import { getEffectiveEntitlements, getEffectivePlan, getFeatureLimit } from "@/lib/entitlements/engine";
import { getLiveUsageSnapshot } from "@/lib/usage/live";
import { isSelfHosted } from "@/lib/env";
import { formatDate } from "@/lib/utils";

export default async function CustomerSubscriptionPage() {
  const access = await requireModuleAccess({ permission: "billing.view" });
  if (!access.permitted) return <ForbiddenState />;
  if (isSelfHosted()) {
    return (
      <div className="space-y-3">
        <h1 className="text-xl font-semibold">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          This instance is self-hosted. Module access is controlled by license, not SaaS plans.
        </p>
      </div>
    );
  }

  const orgId = access.organization.id;
  const [plan, entitlements, usage, usersLimit, sitesLimit] = await Promise.all([
    getEffectivePlan(access.supabase, orgId),
    getEffectiveEntitlements(access.supabase, orgId),
    getLiveUsageSnapshot(access.supabase, orgId),
    getFeatureLimit(access.supabase, orgId, "max_users"),
    getFeatureLimit(access.supabase, orgId, "max_sites"),
  ]);
  const planRow = plan?.plans as { name?: string; code?: string } | null;
  const enabled = entitlements.filter((row) => row.enabled);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Subscription</h1>
        <p className="text-sm text-muted-foreground">
          Your organization plan, included features, and live usage. Internal SaaS administration is not shown here.
        </p>
      </div>
      <section className="rounded-xl border border-border bg-card p-5 text-sm">
        <p>
          Current plan: <strong>{planRow?.name ?? planRow?.code ?? "None"}</strong>
        </p>
        <p className="mt-1 capitalize text-muted-foreground">
          Status {plan?.status ?? "—"}
          {plan?.current_period_end ? ` · period ends ${formatDate(plan.current_period_end)}` : ""}
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <UsageBar label="Users" current={usage.users} limit={usersLimit} />
          <UsageBar label="Sites" current={usage.sites} limit={sitesLimit} />
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">Enabled features</h2>
        <ul className="mt-3 grid gap-1 text-sm md:grid-cols-2">
          {enabled.map((row) => (
            <li key={row.featureCode}>✓ {row.featureCode.replaceAll("_", " ")}</li>
          ))}
        </ul>
      </section>
      <div className="flex gap-2">
        <Button asChild>
          <Link href="/app/settings/billing">Explore upgrade</Link>
        </Button>
      </div>
    </div>
  );
}

function UsageBar({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number | null;
}) {
  const pct = limit && limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs">
        <span>{label}</span>
        <span className="tabular-nums">
          {current}
          {limit == null ? " / unlimited" : ` / ${limit}`}
        </span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary" style={{ width: `${limit == null ? 8 : pct}%` }} />
      </div>
    </div>
  );
}
