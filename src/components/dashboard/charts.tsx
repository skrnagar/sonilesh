"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const GRID = { stroke: "var(--border)", strokeDasharray: "3 3" };

function ChartFrame({
  title,
  empty,
  children,
  hasData,
}: {
  title: string;
  empty: string;
  hasData: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="h-64 p-3">
        {hasData ? (
          children
        ) : (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            {empty}
          </div>
        )}
      </div>
    </div>
  );
}

export function IncidentTrendChart({
  data,
}: {
  data: Array<{ label: string; incidents: number; nearMisses: number }>;
}) {
  const hasData = data.some((d) => d.incidents || d.nearMisses);
  return (
    <ChartFrame title="Incident trend" empty="Record incidents to see the period trend." hasData={hasData}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" tick={AXIS} />
          <YAxis allowDecimals={false} tick={AXIS} width={28} />
          <Tooltip />
          <Area type="monotone" dataKey="incidents" stroke="#0b3a53" fill="#0b3a53" fillOpacity={0.18} />
          <Area type="monotone" dataKey="nearMisses" stroke="#b45309" fill="#b45309" fillOpacity={0.12} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function SeverityChart({
  data,
}: {
  data: Array<{ label: string; value: number; color?: string }>;
}) {
  const hasData = data.some((d) => d.value);
  return (
    <ChartFrame title="Severity mix" empty="No incident severity in this period." hasData={hasData}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" tick={AXIS} />
          <YAxis allowDecimals={false} tick={AXIS} width={28} />
          <Tooltip />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.color || "#1f6f8b"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function NamedBarChart({
  title,
  empty,
  data,
  color = "#1f6f8b",
}: {
  title: string;
  empty: string;
  data: Array<{ label: string; value: number }>;
  color?: string;
}) {
  const hasData = data.some((d) => d.value);
  return (
    <ChartFrame title={title} empty={empty} hasData={hasData}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid {...GRID} />
          <XAxis dataKey="label" tick={AXIS} />
          <YAxis allowDecimals={false} tick={AXIS} width={28} />
          <Tooltip />
          <Bar dataKey="value" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function ContractorScoreChart({
  data,
}: {
  data: Array<{ label: string; score: number }>;
}) {
  return (
    <ChartFrame
      title="Contractor safety score"
      empty="No contractor scores yet."
      hasData={data.length > 0}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
          <CartesianGrid {...GRID} />
          <XAxis type="number" domain={[0, 100]} tick={AXIS} />
          <YAxis type="category" dataKey="label" width={90} tick={AXIS} />
          <Tooltip />
          <Bar dataKey="score" fill="#0f766e" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

export function RiskHeatMap({
  cells,
}: {
  cells: Array<{ l: number; c: number; count: number }>;
}) {
  const max = Math.max(0, ...cells.map((c) => c.count));
  return (
    <div className="rounded-2xl border border-border bg-card shadow-[var(--shadow-sm)]">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold tracking-tight">Residual risk matrix</h3>
      </div>
      <div className="p-4">
        {max === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Risk assessments with likelihood and consequence will populate this heat map.
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-1">
            {cells.map((cell) => {
              const score = cell.l * cell.c;
              const bg =
                score >= 15
                  ? "bg-[#b42318]"
                  : score >= 10
                    ? "bg-[#b45309]"
                    : score >= 6
                      ? "bg-[#ca8a04]"
                      : "bg-[#0f766e]";
              return (
                <div
                  key={`${cell.l}-${cell.c}`}
                  className={`${bg} flex aspect-square items-center justify-center rounded-md text-xs font-semibold text-white`}
                  title={`L${cell.l} × C${cell.c}: ${cell.count}`}
                >
                  {cell.count || ""}
                </div>
              );
            })}
          </div>
        )}
        <p className="mt-3 text-xs text-muted-foreground">Likelihood (rows, high→low) × consequence (columns).</p>
      </div>
    </div>
  );
}
