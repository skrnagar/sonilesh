import { ExecutiveSubnav } from "@/components/analytics/subnav";
import { PrintButton } from "@/components/analytics/print-button";
import { analyticsGate, loadAnalyticsAccess, loadControlTower, type AnalyticsSearch } from "@/lib/analytics/page-load";
import { formatDate } from "@/lib/utils";

export default async function ExecutiveReportPage({
  searchParams,
}: {
  searchParams: Promise<AnalyticsSearch>;
}) {
  const search = await searchParams;
  const access = await loadAnalyticsAccess("executive_analytics");
  const gate = analyticsGate(access, "Executive analytics");
  if (!gate.ok) return gate.node;
  const { ctx, tower } = await loadControlTower(access, search);

  return (
    <div className="space-y-5">
      <div className="print:hidden">
        <h1 className="font-display text-xl font-semibold">Executive report</h1>
        <p className="text-sm text-muted-foreground">
          Print this page (browser print to PDF). No separate PDF engine — same metrics as the Control Tower.
        </p>
        <div className="mt-3">
          <ExecutiveSubnav current="/app/executive/report" />
        </div>
        <PrintButton />
      </div>
      <article className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-border bg-card p-6 print:border-0 print:p-0">
        <header className="border-b border-border pb-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">SONIL EHS360</p>
          <h2 className="text-2xl font-semibold">EHS Control Tower report</h2>
          <p className="text-sm">
            {ctx.organizationName} · {ctx.period.label} ({ctx.timezone})
          </p>
          <p className="text-xs text-muted-foreground">Generated {formatDate(new Date())}. Counts from accessible records only.</p>
        </header>
        <ul className="space-y-1 text-sm">
          {tower.summaries.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border text-xs uppercase text-muted-foreground">
              <th className="py-2">KPI</th>
              <th className="py-2">Value</th>
              <th className="py-2">Vs prior</th>
              <th className="py-2">Type</th>
            </tr>
          </thead>
          <tbody>
            {tower.metrics.map((m) => (
              <tr key={m.code} className="border-b border-border">
                <td className="py-2">{m.label}</td>
                <td className="py-2 tabular-nums">{m.display}</td>
                <td className="py-2">{m.trend == null ? "—" : `${m.trend}%`}</td>
                <td className="py-2 capitalize">{m.classification}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {tower.health.score != null ? (
          <p className="text-sm">
            Optional EHS Health: {tower.health.score}/100. See Control Tower for the component table — this is not a
            certification.
          </p>
        ) : null}
      </article>
    </div>
  );
}
