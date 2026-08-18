"use client";

import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

function PreviewSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-xl border border-border bg-muted/40", className)}
      aria-hidden
    />
  );
}

export const LazyDashboardPreview = dynamic(
  () => import("@/components/marketing/dashboard-preview").then((m) => m.DashboardPreview),
  { loading: () => <PreviewSkeleton className="min-h-[320px] w-full lg:min-h-[420px]" /> },
);

export const LazyWorkflowDiagram = dynamic(
  () => import("@/components/marketing/workflow-diagram").then((m) => m.WorkflowDiagram),
  { loading: () => <PreviewSkeleton className="min-h-[280px] w-full" /> },
);

export const LazyPricingBoard = dynamic(
  () => import("@/components/marketing/pricing-board").then((m) => m.PricingBoard),
  { loading: () => <PreviewSkeleton className="min-h-[360px] w-full" /> },
);
