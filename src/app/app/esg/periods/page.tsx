import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveReportingPeriodAction, setReportingPeriodStatusAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listRecordedMetricsForPeriod } from "@/lib/services/esg";

export default async function EsgPeriodsPage() {
  const access = await requireModuleAccess({
    featureCode: "esg",
    permission: "esg.view",
  });
  if (!access.entitled) return <UpgradeState featureName="ESG" />;
  if (!access.permitted) return <ForbiddenState />;

  const { data: periods } = await access.supabase
    .from("esg_reporting_periods")
    .select("id, period_label, period_start, period_end, status")
    .eq("organization_id", access.organization.id)
    .order("period_label", { ascending: false });

  const withCounts = await Promise.all(
    (periods ?? []).map(async (period) => {
      const recorded = await listRecordedMetricsForPeriod(
        access.supabase,
        access.organization.id,
        period.period_label,
      );
      return { ...period, recorded: recorded.length };
    }),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">ESG periods</h1>
        <p className="text-sm text-muted-foreground">
          Period rows are containers. Metric values listed are only those actually recorded.
        </p>
      </div>
      <ActionForm action={saveReportingPeriodAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
        <div>
          <Label htmlFor="periodLabel">Period label</Label>
          <Input id="periodLabel" name="periodLabel" required placeholder="2025-26" />
        </div>
        <div>
          <Label htmlFor="periodStart">Start</Label>
          <Input id="periodStart" name="periodStart" type="date" />
        </div>
        <div>
          <Label htmlFor="periodEnd">End</Label>
          <Input id="periodEnd" name="periodEnd" type="date" />
        </div>
        <Button type="submit">Save period</Button>
      </ActionForm>
      <ul className="divide-y rounded-2xl border border-border bg-card">
        {withCounts.map((row) => (
          <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>
              {row.period_label} · {row.status}
            </span>
            <span className="flex items-center gap-3">
              <span className="text-muted-foreground">{row.recorded} recorded metric(s)</span>
              <ActionForm action={setReportingPeriodStatusAction} className="flex gap-2">
                <input type="hidden" name="periodId" value={row.id} />
                <select name="status" defaultValue={row.status} className="rounded-md border border-border bg-background px-2 py-1 text-xs">
                  <option value="open">Open</option>
                  <option value="data_collection">Data collection</option>
                  <option value="review">Review</option>
                  <option value="approved">Approved</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                  <option value="locked">Locked</option>
                </select>
                <Button type="submit" size="sm" variant="outline">
                  Set status
                </Button>
              </ActionForm>
            </span>
          </li>
        ))}
        {!withCounts.length ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No periods yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
