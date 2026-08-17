"use client";

import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

export function MaterialityScatter({
  points,
}: {
  points: Array<{ topic: string; stakeholder_score: number; business_impact_score: number }>;
}) {
  return (
    <div className="h-80 w-full rounded-2xl border border-border bg-card p-3">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid />
          <XAxis type="number" dataKey="stakeholder_score" name="Stakeholder" domain={[0, 5]} />
          <YAxis type="number" dataKey="business_impact_score" name="Business impact" domain={[0, 5]} />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            formatter={(value, name) => [value, name]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.topic ?? ""}
          />
          <Scatter data={points} fill="var(--primary)" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
