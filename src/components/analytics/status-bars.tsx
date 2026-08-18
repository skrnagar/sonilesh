import { NamedBarChart } from "@/components/dashboard/charts";
import type { SeriesPoint } from "@/lib/analytics/types";

export function StatusBars({ title, empty, data }: { title: string; empty: string; data: SeriesPoint[] }) {
  return <NamedBarChart title={title} empty={empty} data={data} color="var(--chart-3)" />;
}
