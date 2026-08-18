"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { SAMPLE_CAPA_PIPELINE, SAMPLE_DATA_LABEL } from "@/lib/marketing/sample-board";
import { MKT_CHART } from "@/components/marketing/charts/chart-theme";

export function CapaPipelineChart({ className }: { className?: string }) {
  const data = SAMPLE_CAPA_PIPELINE.map((row) => ({ ...row }));
  return (
    <div className={className}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">CAPA pipeline</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {SAMPLE_DATA_LABEL} · illustrative
        </p>
      </div>
      <div className="mt-2 h-44 min-w-0 sm:h-52">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
            <CartesianGrid {...MKT_CHART.grid} vertical={false} />
            <XAxis dataKey="status" tick={MKT_CHART.axis} interval={0} />
            <YAxis allowDecimals={false} tick={MKT_CHART.axis} width={28} />
            <Tooltip {...MKT_CHART.tooltip} />
            <Bar dataKey="count" fill={MKT_CHART.colors.safety} radius={[4, 4, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
