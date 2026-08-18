export const MKT_CHART = {
  axis: { fontSize: 11, fill: "var(--muted-foreground)" },
  grid: { stroke: "var(--border)", strokeDasharray: "3 3" },
  tooltip: {
    contentStyle: {
      background: "var(--card)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      color: "var(--foreground)",
      boxShadow: "var(--shadow-md)",
      fontSize: 12,
    },
    labelStyle: { color: "var(--foreground)" },
    itemStyle: { color: "var(--muted-foreground)" },
  },
  colors: {
    primary: "var(--chart-1)",
    warning: "var(--chart-2)",
    safety: "var(--chart-3)",
    mid: "var(--chart-4)",
    danger: "var(--chart-5)",
    infra: "var(--mkt-infra)",
  },
} as const;
