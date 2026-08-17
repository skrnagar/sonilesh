"use client";

import dynamic from "next/dynamic";

export const DashboardCharts = dynamic(() => import("@/components/dashboard/charts-section"), {
  ssr: false,
  loading: () => <div className="h-64 rounded-2xl border border-border bg-card" />,
});
