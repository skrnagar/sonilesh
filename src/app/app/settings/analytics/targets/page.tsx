import { SettingsNav } from "@/components/organization/settings-nav";
import { ActionForm } from "@/components/shared/action-form";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { saveMetricTargetAction, saveWorkforceHoursAction } from "@/app/actions/analytics";
import Link from "next/link";

export default async function AnalyticsTargetsPage() {
  const access = await requireModuleAccess({
    featureCode: "advanced_analytics",
    permission: "analytics.manage",
  });
  if (!access.entitled) return <UpgradeState featureName="Advanced analytics" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: defs }, { data: targets }, { data: sites }] = await Promise.all([
    access.supabase
      .from("metric_definitions")
      .select("code, name")
      .is("organization_id", null)
      .eq("is_active", true)
      .order("sort_order"),
    access.supabase
      .from("metric_targets")
      .select("id, metric_code, target_value, warning_value, period_kind, notes")
      .eq("organization_id", access.organization.id)
      .order("created_at", { ascending: false })
      .limit(40),
    access.supabase.from("sites").select("id, name").eq("organization_id", access.organization.id).is("deleted_at", null),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Metric targets &amp; hours</h1>
        <p className="text-sm text-muted-foreground">
          Targets are configuration. Workforce hours are an entered denominator — never estimated.
        </p>
      </div>
      <SettingsNav current="/app/settings/analytics/targets" />
      <p className="text-sm">
        <Link className="underline" href="/app/settings/analytics/metrics">
          Metric definitions
        </Link>
      </p>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Add target</h2>
        <ActionForm action={saveMetricTargetAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Label>
            Metric
            <Select name="metricCode" required className="mt-1">
              {(defs ?? []).map((d) => (
                <option key={d.code} value={d.code}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            Target value
            <Input name="targetValue" type="number" step="0.01" required className="mt-1" />
          </Label>
          <Label>
            Warning value
            <Input name="warningValue" type="number" step="0.01" className="mt-1" />
          </Label>
          <Label>
            Period
            <Select name="periodKind" defaultValue="fy" className="mt-1">
              <option value="month">Month</option>
              <option value="quarter">Quarter</option>
              <option value="fy">Fiscal year</option>
            </Select>
          </Label>
          <div className="sm:col-span-2">
            <Button type="submit">Save target</Button>
          </div>
        </ActionForm>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Enter workforce hours</h2>
        <ActionForm action={saveWorkforceHoursAction} className="mt-3 grid gap-3 sm:grid-cols-2">
          <Label>
            Site (optional)
            <Select name="siteId" className="mt-1">
              <option value="">Organization</option>
              {(sites ?? []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Label>
          <Label>
            Hours
            <Input name="hours" type="number" min="0" step="0.01" required className="mt-1" />
          </Label>
          <Label>
            Period start
            <Input name="periodStart" type="date" required className="mt-1" />
          </Label>
          <Label>
            Period end
            <Input name="periodEnd" type="date" required className="mt-1" />
          </Label>
          <div className="sm:col-span-2">
            <Button type="submit">Save hours</Button>
          </div>
        </ActionForm>
      </section>

      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {(targets ?? []).map((t) => (
          <li key={t.id} className="px-4 py-3 text-sm">
            <span className="font-medium">{t.metric_code}</span> · target {t.target_value} · {t.period_kind}
          </li>
        ))}
        {(targets ?? []).length === 0 ? (
          <li className="px-4 py-3 text-sm text-muted-foreground">No targets yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
