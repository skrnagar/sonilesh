"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { RiskHeatmap } from "@/components/marketing/charts/risk-heatmap";
import { MarketingCapaChart } from "@/components/marketing/charts/lazy";
import {
  BOARD_TABS,
  SAMPLE_COMPLIANCE_WEEK,
  SAMPLE_DATA_LABEL,
  SAMPLE_ESG_CARDS,
  SAMPLE_INCIDENTS,
  SAMPLE_KPIS,
  SAMPLE_PERMITS,
  type BoardTab,
} from "@/lib/marketing/sample-board";
import { formatSampleKpi } from "@/lib/marketing/sample-kpi";
import { cn } from "@/lib/utils";

const openIncidents = formatSampleKpi(SAMPLE_KPIS.openIncidents);
const overdueCapa = formatSampleKpi(SAMPLE_KPIS.overdueCapa);
const permitsActive = formatSampleKpi(SAMPLE_KPIS.permitsActive);

function SampleMark() {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">
      {SAMPLE_DATA_LABEL}
    </p>
  );
}

function KpiTile({
  label,
  value,
  className,
  tick,
}: {
  label: string;
  value: string;
  className?: string;
  tick?: boolean;
}) {
  return (
    <div className="rounded-md border border-[#d7dee7] bg-white px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{label}</p>
      <p className={cn("mt-1 text-lg font-semibold tabular-nums", className)}>
        <span data-mkt-kpi={label}>{value}</span>
        {tick ? <span className="mkt-kpi-pulse" aria-hidden /> : null}
      </p>
    </div>
  );
}

function DashboardPanel() {
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <KpiTile label="Open incidents" value={openIncidents} className="text-primary" tick />
        <KpiTile label="Overdue CAPA" value={overdueCapa} className="text-[#b45309]" />
        <KpiTile label="Permits active" value={permitsActive} className="text-[#0f766e]" />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="rounded-md border border-[#d7dee7] bg-white p-3">
          <RiskHeatmap />
        </div>
        <div className="rounded-md border border-[#d7dee7] bg-white p-3">
          <p className="text-xs font-semibold">CAPA pipeline</p>
          <ul className="mt-3 space-y-2">
            {[
              ["Lockout verification", "Due today", "warning"],
              ["Scaffold inspection gap", "In progress", "default"],
              ["Near-miss trend review", "Verified", "success"],
            ].map(([title, status, variant]) => (
              <li key={title} className="flex items-center justify-between gap-2 text-xs">
                <span className="truncate text-slate-700">{title}</span>
                <Badge
                  variant={
                    variant === "warning" ? "warning" : variant === "success" ? "success" : "secondary"
                  }
                >
                  {status}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

function IncidentsPanel() {
  return (
    <div className="rounded-md border border-[#d7dee7] bg-white p-3">
      <p className="text-xs font-semibold">Open incidents</p>
      <ul className="mt-3 space-y-2">
        {SAMPLE_INCIDENTS.map((row) => (
          <li key={row.id} className="flex items-start justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.title}</p>
              <p className="text-slate-500">
                {row.id} · {row.site} · {row.age}
              </p>
            </div>
            <Badge
              variant={
                row.severity === "High" ? "danger" : row.severity === "Medium" ? "warning" : "secondary"
              }
            >
              {row.severity}
            </Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function PermitsPanel() {
  return (
    <div className="rounded-md border border-[#d7dee7] bg-white p-3">
      <p className="text-xs font-semibold">Active permits</p>
      <ul className="mt-3 space-y-2">
        {SAMPLE_PERMITS.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-2 text-xs">
            <div className="min-w-0">
              <p className="truncate font-medium text-slate-800">{row.type}</p>
              <p className="text-slate-500">
                {row.id} · {row.area}
              </p>
            </div>
            <Badge variant={row.status === "Expiring" ? "warning" : "success"}>{row.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CompliancePanel() {
  return (
    <div className="rounded-md border border-[#d7dee7] bg-white p-3">
      <p className="text-xs font-semibold">This week (sample calendar)</p>
      <ol className="mt-3 grid grid-cols-7 gap-1">
        {SAMPLE_COMPLIANCE_WEEK.map((cell) => (
          <li
            key={cell.day}
            className={cn(
              "rounded-md px-1 py-2 text-center",
              cell.tone === "due" && "bg-[#fef3c7]",
              cell.tone === "open" && "bg-[#d1fae5]",
              cell.tone === "idle" && "bg-slate-50",
            )}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">{cell.day}</p>
            <p className="mt-1 truncate text-[10px] text-slate-700">{cell.label}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

function EsgPanel() {
  return (
    <div className="grid grid-cols-2 gap-2">
      {SAMPLE_ESG_CARDS.map((card) => (
        <div key={card.label} className="rounded-md border border-[#d7dee7] bg-white px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">{card.label}</p>
          <p className="mt-1 text-lg font-semibold tabular-nums text-primary">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function AnalyticsPanel() {
  return (
    <div className="grid gap-2 md:grid-cols-2">
      <div className="rounded-md border border-[#d7dee7] bg-white p-3">
        <RiskHeatmap />
      </div>
      <div className="rounded-md border border-[#d7dee7] bg-white p-3">
        <MarketingCapaChart />
      </div>
    </div>
  );
}

export function DashboardPreview({ className }: { className?: string }) {
  const [tab, setTab] = useState<BoardTab>("Dashboard");
  const [chartsArmed, setChartsArmed] = useState(false);

  function selectTab(next: BoardTab) {
    setTab(next);
    if (next === "Analytics") setChartsArmed(true);
  }

  return (
    <div
      className={cn(
        "grid gap-3 rounded-md bg-[#f4f7fa] p-3 text-[#0f172a] sm:grid-cols-[148px_1fr]",
        className,
      )}
    >
      <aside className="hidden space-y-1 rounded-md bg-[#0b3a53] p-3 text-white sm:block">
        <p className="mb-2 text-xs font-semibold tracking-wide text-white/70">Workspace</p>
        {BOARD_TABS.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => selectTab(item)}
            className={cn(
              "block w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors motion-reduce:transition-none",
              tab === item ? "bg-white/15 font-medium" : "text-white/70 hover:bg-white/10 hover:text-white",
            )}
            aria-pressed={tab === item}
          >
            {item}
          </button>
        ))}
      </aside>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Operations</p>
            <p className="text-sm font-semibold tracking-tight">Site control board</p>
          </div>
          <div className="flex items-center gap-2">
            <SampleMark />
            <Badge variant="success">Live mock</Badge>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto pb-1 sm:hidden">
          {BOARD_TABS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => selectTab(item)}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-medium",
                tab === item ? "bg-[#0b3a53] text-white" : "bg-white text-slate-600",
              )}
            >
              {item}
            </button>
          ))}
        </div>
        {tab === "Dashboard" ? <DashboardPanel /> : null}
        {tab === "Incidents" ? <IncidentsPanel /> : null}
        {tab === "Permits" ? <PermitsPanel /> : null}
        {tab === "Compliance" ? <CompliancePanel /> : null}
        {tab === "ESG" ? <EsgPanel /> : null}
        {tab === "Analytics" && chartsArmed ? <AnalyticsPanel /> : null}
      </div>
    </div>
  );
}
