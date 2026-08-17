import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveBrsrAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  brsrDataCoverage,
  computeEmployeeHealthSafetyFromIncidents,
  listReportingFramework,
} from "@/lib/services/esg";

export default async function BrsrReportPage() {
  const access = await requireModuleAccess({
    featureCode: "brsr",
    permission: "brsr.view",
  });
  if (!access.entitled) return <UpgradeState featureName="BRSR reporting" />;
  if (!access.permitted) return <ForbiddenState />;

  const fyStart = new Date().getFullYear() - 1;
  const financialYear = `${fyStart}-${String(fyStart + 1).slice(-2)}`;
  const periodStart = `${fyStart}-04-01`;
  const periodEnd = `${fyStart + 1}-03-31`;

  const [{ data: profile }, { data: metrics }, { data: ghg }, { data: existing }, safety, coverage, catalog] =
    await Promise.all([
      access.supabase
        .from("org_compliance_profile")
        .select("*")
        .eq("organization_id", access.organization.id)
        .maybeSingle(),
      access.supabase
        .from("esg_metrics")
        .select("metric_key, value, unit, source, notes")
        .eq("organization_id", access.organization.id)
        .eq("period", financialYear),
      access.supabase
        .from("ghg_emissions")
        .select("scope, value_tco2e")
        .eq("organization_id", access.organization.id)
        .gte("period_start", periodStart)
        .lte("period_end", periodEnd),
      access.supabase
        .from("brsr_reports")
        .select("id, status, section_b")
        .eq("organization_id", access.organization.id)
        .eq("financial_year", financialYear)
        .maybeSingle(),
      computeEmployeeHealthSafetyFromIncidents(
        access.supabase,
        access.organization.id,
        periodStart,
        periodEnd,
      ),
      brsrDataCoverage(access.supabase, access.organization.id, financialYear),
      listReportingFramework(access.supabase, "brsr"),
    ]);

  const ghgTotals = { "1": 0, "2": 0, "3": 0 };
  for (const row of ghg ?? []) {
    const scope = row.scope as "1" | "2" | "3";
    ghgTotals[scope] += Number(row.value_tco2e ?? 0);
  }

  const coreIndicators =
    catalog.sections.find((s) => s.code === "C")?.indicators.filter((i) => i.is_core) ?? [];
  const processIndicators = catalog.sections.find((s) => s.code === "B")?.indicators ?? [];
  const metricMap = Object.fromEntries((metrics ?? []).map((m) => [m.metric_key, m]));
  const sectionA = {
    name: access.organization.name,
    industry: profile?.industry_sector ?? access.organization.industry,
    listed: profile?.is_listed ?? false,
    market_cap_rank: profile?.market_cap_rank,
    states: profile?.states_of_operation ?? [],
    employee_band: profile?.employee_count_band,
    exports_to_eu: profile?.exports_to_eu ?? false,
  };
  const sectionC = {
    ghg_scope_1: ghgTotals["1"],
    ghg_scope_2: ghgTotals["2"],
    ghg_scope_3: ghgTotals["3"],
    employee_health_safety_incidents: safety.incident_count,
    employee_health_safety_source: "ehs_events",
    metrics: metricMap,
  };
  const savedB = (existing?.section_b ?? {}) as Record<string, { has_policy?: string; disclosure?: string }>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">BRSR report builder</h1>
        <p className="text-sm text-muted-foreground">
          Sections follow the configured BRSR catalog ({catalog.framework?.version ?? "not seeded"}).
          Missing metrics stay blank. {coverage.label} ({coverage.filled}/{coverage.total}).
        </p>
      </div>
      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="font-semibold">Section A — General disclosures</h2>
        <pre className="mt-2 overflow-x-auto text-xs">{JSON.stringify(sectionA, null, 2)}</pre>
      </section>
      <section className="rounded-2xl border border-border bg-card p-4 text-sm">
        <h2 className="font-semibold">Section C — BRSR Core (live)</h2>
        <ul className="mt-2 list-disc pl-5">
          <li>
            GHG S1/S2/S3: {ghgTotals["1"]} / {ghgTotals["2"]} / {ghgTotals["3"]} tCO2e
          </li>
          <li>Attribute 5 incidents (from EHS): {safety.incident_count}</li>
          {coreIndicators
            .filter((k) => k.code !== "employee_health_safety" && k.code !== "ghg_emissions")
            .map((k) => (
            <li key={k.code}>
              {k.title}: {metricMap[k.code]?.value ?? "—"} {metricMap[k.code]?.unit ?? k.unit ?? ""}
            </li>
          ))}
        </ul>
      </section>
      <ActionForm action={saveBrsrAction} className="space-y-4 rounded-2xl border border-border bg-card p-4">
        <input type="hidden" name="financialYear" value={financialYear} />
        <input type="hidden" name="sectionA" value={JSON.stringify(sectionA)} />
        <input type="hidden" name="sectionC" value={JSON.stringify(sectionC)} />
        <h2 className="font-semibold">Section B — NGRBC process disclosures</h2>
        {processIndicators.map((p) => (
          <div key={p.code} className="grid gap-2 md:grid-cols-[80px_140px_1fr] md:items-center">
            <span className="text-sm font-medium">{p.code}</span>
            <select
              name={`b_${p.code}_policy`}
              defaultValue={savedB[p.code]?.has_policy ?? "yes"}
              className="rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              <option value="yes">Policy in place</option>
              <option value="no">No policy yet</option>
            </select>
            <input
              name={`b_${p.code}_text`}
              defaultValue={savedB[p.code]?.disclosure ?? p.title}
              className="rounded-md border border-border bg-background px-3 py-1 text-sm"
            />
          </div>
        ))}
        <div className="flex gap-3">
          <Button type="submit">Save draft</Button>
          {existing?.id ? (
            <a className="text-sm underline" href={`/app/esg/brsr-report/export?fy=${financialYear}`}>
              Export Section A/B/C
            </a>
          ) : (
            <span className="text-sm text-muted-foreground">Save once to enable export.</span>
          )}
        </div>
      </ActionForm>
    </div>
  );
}
