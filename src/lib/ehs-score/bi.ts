import type { EhsScoreStatus } from "@/lib/services/ehs-score";
import { MONTH_LABELS } from "@/lib/constants/calendar";

export type EhsScoreBiFilters = {
  businessUnitId?: string;
  regionId?: string;
  projectId?: string;
  year: number;
  month: number;
};

export type EhsAssessmentRow = {
  businessUnitName: string;
  regionName: string;
  projectName: string;
  pending: number;
};

export type EhsScoreYearBar = {
  year: string;
  count: number;
};

export type EhsScoreStatusRow = {
  id: string;
  businessUnitName: string;
  regionName: string;
  projectName: string;
  location: string;
  overallScore: number | null;
  status: EhsScoreStatus | "pending_mis" | "no_submission";
  statusLabel: string;
};

export type EhsScoreBiDashboard = {
  filters: EhsScoreBiFilters;
  periodLabel: string;
  assessmentRows: EhsAssessmentRow[];
  yearlyBars: EhsScoreYearBar[];
  statusRows: EhsScoreStatusRow[];
  dataNote: string | null;
};

export { MONTH_LABELS };

export function ehsScoreBiPeriodLabel(year: number, month: number) {
  const label = MONTH_LABELS[month - 1] ?? String(month);
  return `${label} ${year}`;
}

export function defaultEhsScoreBiFilters(
  workspace: {
    businessUnitId?: string | null;
    regionId?: string | null;
    projectId?: string | null;
  },
  overrides?: Partial<EhsScoreBiFilters>,
): EhsScoreBiFilters {
  const now = new Date();
  return {
    businessUnitId: overrides?.businessUnitId ?? workspace.businessUnitId ?? undefined,
    regionId: overrides?.regionId ?? workspace.regionId ?? undefined,
    projectId: overrides?.projectId ?? workspace.projectId ?? undefined,
    year: overrides?.year ?? now.getUTCFullYear(),
    month: overrides?.month ?? now.getUTCMonth() + 1,
  };
}
