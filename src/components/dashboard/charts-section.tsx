"use client";

import {
  ContractorScoreChart,
  IncidentTrendChart,
  NamedBarChart,
  RiskHeatMap,
  SeverityChart,
} from "@/components/dashboard/charts";

type Named = Array<{ label: string; value: number }>;

export function DashboardCharts({
  incidentTrend,
  severitySeries,
  nearMissSeries,
  capaAging,
  riskHeat,
  inspectionSeries,
  trainingSeries,
  contractorSeries,
}: {
  incidentTrend: Array<{ label: string; incidents: number; nearMisses: number }>;
  severitySeries: Array<{ label: string; value: number; color?: string }>;
  nearMissSeries: Named;
  capaAging: Named;
  riskHeat: Array<{ l: number; c: number; count: number }>;
  inspectionSeries: Named;
  trainingSeries: Named;
  contractorSeries: Array<{ label: string; score: number }>;
}) {
  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-2">
      <IncidentTrendChart data={incidentTrend} />
      <SeverityChart data={severitySeries} />
      <NamedBarChart
        title="Near miss vs incidents"
        empty="No events in this period."
        data={nearMissSeries}
        color="var(--chart-2)"
      />
      <NamedBarChart
        title="CAPA aging"
        empty="No open CAPA to age."
        data={capaAging}
        color="var(--chart-5)"
      />
      <RiskHeatMap cells={riskHeat} />
      <NamedBarChart
        title="Inspection status"
        empty="No inspection assignments yet."
        data={inspectionSeries}
        color="var(--chart-3)"
      />
      <NamedBarChart
        title="Training status"
        empty="No training assignments yet."
        data={trainingSeries}
        color="var(--chart-4)"
      />
      <ContractorScoreChart data={contractorSeries} />
    </div>
  );
}

export default DashboardCharts;
