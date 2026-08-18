"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  SAMPLE_COMPLIANCE_DOMAINS,
  SAMPLE_COMPLIANCE_DONUT,
  SAMPLE_DATA_LABEL,
} from "@/lib/marketing/sample-board";
import { MKT_CHART } from "@/components/marketing/charts/chart-theme";

const DONUT_COLORS = [MKT_CHART.colors.safety, MKT_CHART.colors.warning, MKT_CHART.colors.danger];

export function ComplianceStatusChart({ className }: { className?: string }) {
  const donut = SAMPLE_COMPLIANCE_DONUT.map((row) => ({ ...row }));
  const stacked = SAMPLE_COMPLIANCE_DOMAINS.map((row) => ({ ...row }));

  return (
    <div className={className}>
      <div className="grid min-w-0 gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Obligation status</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {SAMPLE_DATA_LABEL} · illustrative
            </p>
          </div>
          <div className="mt-2 h-52 min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donut}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="48%"
                  outerRadius="72%"
                  paddingAngle={2}
                >
                  {donut.map((entry, i) => (
                    <Cell key={entry.name} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...MKT_CHART.tooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold text-foreground">Status by domain</p>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {SAMPLE_DATA_LABEL} · illustrative
            </p>
          </div>
          <div className="mt-2 h-52 min-w-0 sm:h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stacked} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
                <CartesianGrid {...MKT_CHART.grid} vertical={false} />
                <XAxis dataKey="domain" tick={MKT_CHART.axis} interval={0} />
                <YAxis allowDecimals={false} tick={MKT_CHART.axis} width={28} />
                <Tooltip {...MKT_CHART.tooltip} />
                <Bar dataKey="onTrack" stackId="st" fill={MKT_CHART.colors.safety} name="On track" />
                <Bar dataKey="dueSoon" stackId="st" fill={MKT_CHART.colors.warning} name="Due soon" />
                <Bar dataKey="overdue" stackId="st" fill={MKT_CHART.colors.danger} name="Overdue" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
