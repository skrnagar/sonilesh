"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { RiskHeatmap } from "@/components/marketing/charts/risk-heatmap";
import { cn } from "@/lib/utils";

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("h-52 animate-pulse rounded-xl border border-border bg-muted/40 sm:h-60", className)}
      aria-hidden
    />
  );
}

export const MarketingCapaChart = dynamic(
  () => import("@/components/marketing/charts/capa-pipeline-chart").then((m) => m.CapaPipelineChart),
  { ssr: false, loading: () => <ChartSkeleton className="h-44 sm:h-52" /> },
);

export const MarketingEsgCharts = dynamic(
  () => import("@/components/marketing/charts/esg-sample-charts").then((m) => m.EsgSampleCharts),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export const MarketingComplianceChart = dynamic(
  () =>
    import("@/components/marketing/charts/compliance-status-chart").then((m) => m.ComplianceStatusChart),
  { ssr: false, loading: () => <ChartSkeleton /> },
);

export function ControlRoomVisuals() {
  const ref = useRef<HTMLDivElement>(null);
  const [showChart, setShowChart] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShowChart(true);
        io.disconnect();
      },
      { rootMargin: "240px 0px" },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className="grid min-w-0 gap-4">
      <div className="min-w-0 rounded-xl border border-border bg-card p-4">
        <RiskHeatmap />
      </div>
      <div className="min-w-0 rounded-xl border border-border bg-card p-4">
        {showChart ? <MarketingCapaChart /> : <ChartSkeleton className="h-44 sm:h-52" />}
      </div>
    </div>
  );
}
