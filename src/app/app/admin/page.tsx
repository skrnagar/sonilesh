import Link from "next/link";
import { ForbiddenState } from "@/components/shared/state-panels";
import { Button } from "@/components/ui/button";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getOrganizationSetupCompletion } from "@/lib/services/onboarding-progress";
import { listEnabledFeatures, resolveEntitlement } from "@/lib/services/entitlements";

export default async function CustomerAdminPage() {
  const access = await requireModuleAccess({ permission: "settings.manage" });
  if (!access.permitted) return <ForbiddenState />;

  const [setup, features, sitesEnt, usersEnt, projectsEnt, { data: sub }] =
    await Promise.all([
      getOrganizationSetupCompletion(access.supabase, access.organization.id),
      listEnabledFeatures(access.supabase, access.organization.id),
      resolveEntitlement(access.supabase, access.organization.id, "max_sites"),
      resolveEntitlement(access.supabase, access.organization.id, "max_users"),
      resolveEntitlement(access.supabase, access.organization.id, "max_projects"),
      access.supabase
        .from("subscriptions")
        .select("status, plans:plan_id(name, code)")
        .eq("organization_id", access.organization.id)
        .is("deleted_at", null)
        .maybeSingle(),
    ]);

  const plan = sub?.plans as unknown as { name?: string; code?: string } | null;

  const counts = await Promise.all([
    access.supabase
      .from("organization_members")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", access.organization.id)
      .eq("status", "active")
      .is("deleted_at", null),
    access.supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
    access.supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Customer administration
        </p>
        <h1 className="mt-1 text-2xl font-semibold">{access.organization.name}</h1>
        <p className="text-sm text-muted-foreground">
          Organization admin console — not the SONIL platform control plane.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Plan" value={plan?.name ?? "Trial"} detail={sub?.status ?? "—"} />
        <Stat
          label="Users"
          value={String(counts[0].count ?? 0)}
          detail={
            usersEnt.limitValue != null ? `Limit ${usersEnt.limitValue}` : "Unlimited"
          }
        />
        <Stat
          label="Sites"
          value={String(counts[1].count ?? 0)}
          detail={
            sitesEnt.limitValue != null ? `Limit ${sitesEnt.limitValue}` : "Unlimited"
          }
        />
        <Stat
          label="Projects"
          value={String(counts[2].count ?? 0)}
          detail={
            projectsEnt.limitValue != null
              ? `Limit ${projectsEnt.limitValue}`
              : "Unlimited"
          }
        />
      </div>

      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold">Complete your organization setup</h2>
            <p className="text-sm text-muted-foreground">
              Overall {setup.overall}% — the app stays usable while you finish.
            </p>
          </div>
        </div>
        <ul className="mt-4 space-y-3">
          {setup.items.map((item) => (
            <li key={item.key} className="flex items-center justify-between gap-3 text-sm">
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-muted-foreground">
                    {item.complete ? "✓" : `${item.percent}%`}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${item.percent}%` }}
                  />
                </div>
              </div>
              <Link href={item.href} className="shrink-0 text-xs underline">
                Open
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {[
            { href: "/app/settings/users/invite", label: "Add user" },
            { href: "/app/settings/sites", label: "Create site" },
            { href: "/app/settings/projects", label: "Create project" },
            { href: "/app/settings/departments", label: "Create department" },
            { href: "/app/settings/organization?tab=ehs", label: "Configure EHS" },
            { href: "/app/settings/users", label: "Manage roles" },
            { href: "/app/settings/organization/structure", label: "Structure" },
          ].map((action) => (
            <Button key={action.href} asChild variant="outline" size="sm">
              <Link href={action.href}>{action.label}</Link>
            </Button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-semibold">Enabled features</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Resolved from your subscription entitlements.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {features.length === 0 ? (
            <span className="text-sm text-muted-foreground">No features resolved.</span>
          ) : (
            features.slice(0, 40).map((code) => (
              <span
                key={code}
                className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
              >
                {code}
              </span>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}
