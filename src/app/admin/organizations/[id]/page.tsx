import { notFound } from "next/navigation";
import {
  adminChangePlanAction,
  adminFeatureOverrideAction,
  adminUpdateOrgStatusAction,
} from "@/app/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requirePlatformAdmin } from "@/lib/auth/session";
import { formatDate } from "@/lib/utils";

export default async function AdminOrganizationDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const { supabase } = await requirePlatformAdmin();

  const { data: org } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!org) notFound();

  const [
    { data: members },
    { data: sites },
    { data: projects },
    { data: subscription },
    { data: overrides },
    { data: usage },
    { data: audits },
    { data: plans },
    { data: features },
  ] = await Promise.all([
    supabase
      .from("organization_members")
      .select("id, status, is_owner, profiles:user_id(email, full_name)")
      .eq("organization_id", id)
      .is("deleted_at", null),
    supabase.from("sites").select("*").eq("organization_id", id).is("deleted_at", null),
    supabase.from("projects").select("*").eq("organization_id", id).is("deleted_at", null),
    supabase
      .from("subscriptions")
      .select("*, plans:plan_id(name, code)")
      .eq("organization_id", id)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("organization_feature_overrides")
      .select("*, features:feature_id(code, name)")
      .eq("organization_id", id)
      .order("created_at", { ascending: false }),
    supabase
      .from("usage_metrics")
      .select("*, features:feature_id(code, name)")
      .eq("organization_id", id),
    supabase
      .from("audit_logs")
      .select("*")
      .eq("organization_id", id)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase.from("plans").select("id, name, code").eq("is_active", true).order("sort_order"),
    supabase.from("features").select("id, code, name").eq("is_active", true).order("code"),
  ]);

  const tabs = [
    "overview",
    "users",
    "sites",
    "projects",
    "subscription",
    "features",
    "usage",
    "billing",
    "audit",
    "settings",
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-primary">{org.name}</h1>
          <p className="text-sm text-muted-foreground">
            {org.industry ?? "No industry"} · Created {formatDate(org.created_at)}
          </p>
        </div>
        <Badge variant="secondary" className="capitalize">
          {org.status}
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((item) => (
          <a
            key={item}
            href={`?tab=${item}`}
            className={`rounded-md px-2.5 py-1 text-xs font-medium capitalize ${
              tab === item ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
            }`}
          >
            {item}
          </a>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div className="border border-border bg-card p-4 text-sm">
            <p>Legal name: {org.legal_name ?? "—"}</p>
            <p>Country: {org.country ?? "—"}</p>
            <p>Trial ends: {formatDate(org.trial_ends_at)}</p>
            <p>Last activity: {formatDate(org.last_activity_at)}</p>
          </div>
          <form action={adminUpdateOrgStatusAction} className="space-y-3 border border-border bg-card p-4">
            <input type="hidden" name="organizationId" value={org.id} />
            <Label htmlFor="status">Organization status</Label>
            <Select id="status" name="status" defaultValue={org.status}>
              {["pending", "trial", "active", "suspended", "cancelled", "churned"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
            <Input name="reason" placeholder="Reason (audited)" />
            <Button type="submit">Update status</Button>
          </form>
        </div>
      ) : null}

      {tab === "users" ? (
        <div className="border border-border bg-card">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/70 text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">User</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">Owner</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((member) => {
                const profile = member.profiles as unknown as {
                  email?: string;
                  full_name?: string;
                } | null;
                return (
                  <tr key={member.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      {profile?.full_name || profile?.email || "—"}
                    </td>
                    <td className="px-3 py-2 capitalize">{member.status}</td>
                    <td className="px-3 py-2">{member.is_owner ? "Yes" : "No"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "sites" ? (
        <ul className="space-y-2 text-sm">
          {(sites ?? []).map((site) => (
            <li key={site.id} className="border border-border bg-card px-3 py-2">
              {site.name} ({site.code})
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "projects" ? (
        <ul className="space-y-2 text-sm">
          {(projects ?? []).map((project) => (
            <li key={project.id} className="border border-border bg-card px-3 py-2">
              {project.name} ({project.code})
            </li>
          ))}
          {!projects?.length ? (
            <li className="text-muted-foreground">No projects yet.</li>
          ) : null}
        </ul>
      ) : null}

      {tab === "subscription" || tab === "billing" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-border bg-card p-4 text-sm">
            <p>
              Current plan:{" "}
              {(subscription?.plans as { name?: string } | null)?.name ?? "—"}
            </p>
            <p className="capitalize">Status: {subscription?.status ?? "—"}</p>
            <p>
              Custom monthly:{" "}
              {subscription?.custom_price_monthly_cents != null
                ? `$${(subscription.custom_price_monthly_cents / 100).toFixed(2)}`
                : "—"}
            </p>
            <p>Trial ends: {formatDate(subscription?.trial_ends_at)}</p>
          </div>
          <form action={adminChangePlanAction} className="space-y-3 border border-border bg-card p-4">
            <input type="hidden" name="organizationId" value={org.id} />
            <Label>Change plan</Label>
            <Select name="planId" defaultValue={subscription?.plan_id ?? ""}>
              {(plans ?? []).map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name}
                </option>
              ))}
            </Select>
            <Input
              name="customPriceMonthlyCents"
              type="number"
              placeholder="Custom monthly price (cents)"
            />
            <Input name="extendTrialDays" type="number" placeholder="Extend trial (days)" />
            <Button type="submit">Apply plan changes</Button>
          </form>
        </div>
      ) : null}

      {tab === "features" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Overrides</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(overrides ?? []).map((row) => (
                <li key={row.id} className="border-b border-border py-2">
                  {(row.features as { name?: string } | null)?.name} · enabled=
                  {String(row.enabled)} · limit={String(row.limit_value ?? "—")}
                </li>
              ))}
            </ul>
          </div>
          <form action={adminFeatureOverrideAction} className="space-y-3 border border-border bg-card p-4">
            <input type="hidden" name="organizationId" value={org.id} />
            <Label>Add feature override</Label>
            <Select name="featureId" defaultValue="">
              <option value="" disabled>
                Select feature
              </option>
              {(features ?? []).map((feature) => (
                <option key={feature.id} value={feature.id}>
                  {feature.name} ({feature.code})
                </option>
              ))}
            </Select>
            <Select name="enabled" defaultValue="true">
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </Select>
            <Input name="limitValue" type="number" placeholder="Limit value" />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="unlimited" value="true" /> Unlimited
            </label>
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="isTemporary" value="true" /> Temporary
            </label>
            <Input name="endsAt" type="datetime-local" />
            <Input name="reason" placeholder="Reason" />
            <Button type="submit">Save override</Button>
          </form>
        </div>
      ) : null}

      {tab === "usage" ? (
        <ul className="space-y-2 text-sm">
          {(usage ?? []).map((row) => (
            <li key={row.id} className="border border-border bg-card px-3 py-2">
              {(row.features as { code?: string } | null)?.code}: {row.usage_value}
            </li>
          ))}
          {!usage?.length ? <li className="text-muted-foreground">No usage metrics yet.</li> : null}
        </ul>
      ) : null}

      {tab === "audit" ? (
        <ul className="space-y-2 text-sm">
          {(audits ?? []).map((row) => (
            <li key={row.id} className="border border-border bg-card px-3 py-2">
              <p className="font-medium">{row.action}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(row.created_at)} · {row.entity_type}
              </p>
            </li>
          ))}
        </ul>
      ) : null}

      {tab === "settings" ? (
        <div className="border border-border bg-card p-4 text-sm text-muted-foreground">
          Tenant settings remain owned by the organization. SaaS admin can suspend, change plans,
          set overrides and review audit history without bypassing RLS for normal tenant users.
        </div>
      ) : null}
    </div>
  );
}
