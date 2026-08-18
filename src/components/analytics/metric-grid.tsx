import { KpiCard } from "@/components/dashboard/kpi-card";
import type { MetricValue } from "@/lib/analytics/types";

const ICONS: Record<string, string> = {
  incident_count: "AlertTriangle",
  open_incidents: "FolderOpen",
  critical_incidents: "Siren",
  lost_time_injuries: "AlertTriangle",
  near_miss_count: "ShieldAlert",
  uauc_count: "Eye",
  high_residual_risk: "Grid2x2",
  open_capa: "ListChecks",
  overdue_capa: "ClockAlert",
  capa_effectiveness: "ListChecks",
  inspection_completion: "ClipboardCheck",
  open_findings: "FileSearch",
  active_permits: "FileBadge",
  training_overdue: "GraduationCap",
  contractor_score: "HardHat",
  compliance_overdue: "FileSearch",
  expired_licenses: "FileBadge",
  workforce_hours: "GraduationCap",
};

export function MetricGrid({ metrics }: { metrics: MetricValue[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((kpi) => (
        <KpiCard
          key={kpi.code}
          label={kpi.label}
          value={kpi.display}
          hint={kpi.hint}
          tone={kpi.tone}
          href={kpi.href}
          icon={ICONS[kpi.code]}
          accent={kpi.tone === "critical" ? "red" : kpi.tone === "good" ? "green" : "navy"}
          trend={kpi.trend}
          polarity={kpi.polarity === "neutral" ? "higher-is-better" : kpi.polarity}
        />
      ))}
    </div>
  );
}
