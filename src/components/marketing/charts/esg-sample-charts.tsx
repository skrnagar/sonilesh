"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { SAMPLE_DATA_LABEL, SAMPLE_GHG_STACK, SAMPLE_MATERIALITY } from "@/lib/marketing/sample-board";
import { MKT_CHART } from "@/components/marketing/charts/chart-theme";

export function EsgSampleCharts({ className }: { className?: string }) {
  const stack = SAMPLE_GHG_STACK.map((row) => ({ ...row }));
  const points = SAMPLE_MATERIALITY.map((row) => ({
    topic: row.topic,
    stakeholder: row.stakeholder,
    impact: row.impact,
  }));

  return (
    <div className={className}>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">GHG by quarter (tCO₂e)</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {SAMPLE_DATA_LABEL} · illustrative
            </p>
          </div>
          <div className="mt-2 h-52 min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stack} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid {...MKT_CHART.grid} vertical={false} />
                <XAxis dataKey="quarter" tick={MKT_CHART.axis} />
                <YAxis allowDecimals={false} tick={MKT_CHART.axis} width={32} />
                <Tooltip {...MKT_CHART.tooltip} />
                <Bar dataKey="scope1" stackId="ghg" fill={MKT_CHART.colors.primary} name="Scope 1" />
                <Bar dataKey="scope2" stackId="ghg" fill={MKT_CHART.colors.safety} name="Scope 2" />
                <Bar dataKey="scope3" stackId="ghg" fill={MKT_CHART.colors.infra} name="Scope 3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Materiality (sample topics)</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {SAMPLE_DATA_LABEL} · illustrative
            </p>
          </div>
          <div className="mt-2 h-52 min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 8, right: 8, left: -12, bottom: 4 }}>
                <CartesianGrid {...MKT_CHART.grid} />
                <XAxis
                  type="number"
                  dataKey="stakeholder"
                  name="Stakeholder"
                  domain={[0, 5]}
                  tick={MKT_CHART.axis}
                />
                <YAxis
                  type="number"
                  dataKey="impact"
                  name="Business impact"
                  domain={[0, 5]}
                  tick={MKT_CHART.axis}
                  width={28}
                />
                <ZAxis range={[80, 80]} />
                <Tooltip
                  {...MKT_CHART.tooltip}
                  cursor={{ strokeDasharray: "3 3" }}
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(_, payload) => payload?.[0]?.payload?.topic ?? ""}
                />
                <Scatter data={points} fill={MKT_CHART.colors.safety} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
