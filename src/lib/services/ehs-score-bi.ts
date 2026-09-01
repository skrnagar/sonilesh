import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ehsScoreBiPeriodLabel,
  type EhsAssessmentRow,
  type EhsScoreBiDashboard,
  type EhsScoreBiFilters,
  type EhsScoreStatusRow,
  type EhsScoreYearBar,
} from "@/lib/ehs-score/bi";
import { calculateEhsScore } from "@/lib/services/ehs-score";
import { listMisSubmissions } from "@/lib/services/mis";

export type {
  EhsAssessmentRow,
  EhsScoreBiDashboard,
  EhsScoreBiFilters,
  EhsScoreStatusRow,
  EhsScoreYearBar,
} from "@/lib/ehs-score/bi";
export { defaultEhsScoreBiFilters, ehsScoreBiPeriodLabel, MONTH_LABELS } from "@/lib/ehs-score/bi";

type HierarchyProject = {
  id: string;
  name: string;
  site_id: string | null;
  business_unit_id: string | null;
};

type HierarchySite = {
  id: string;
  name: string;
  region_id: string | null;
  business_unit_id: string | null;
};

type HierarchyRegion = {
  id: string;
  name: string;
  business_unit_id: string | null;
};

type HierarchyBu = { id: string; name: string };

type MisRow = Awaited<ReturnType<typeof listMisSubmissions>>[number];

function resolveProjectScope(
  projects: HierarchyProject[],
  sites: HierarchySite[],
  regions: HierarchyRegion[],
  filters: Pick<EhsScoreBiFilters, "businessUnitId" | "regionId" | "projectId">,
) {
  const siteById = new Map(sites.map((s) => [s.id, s]));
  const regionById = new Map(regions.map((r) => [r.id, r]));

  return projects.filter((project) => {
    if (filters.projectId && project.id !== filters.projectId) return false;
    const site = project.site_id ? siteById.get(project.site_id) : undefined;
    const region = site?.region_id ? regionById.get(site.region_id) : undefined;

    if (filters.regionId) {
      if (!site || site.region_id !== filters.regionId) return false;
    }
    if (filters.businessUnitId) {
      const buId = project.business_unit_id ?? site?.business_unit_id ?? region?.business_unit_id;
      if (buId !== filters.businessUnitId) return false;
    }
    return true;
  });
}

function periodMatchesYearMonth(
  period: { period_start?: string | null } | null | undefined,
  year: number,
  month: number,
) {
  if (!period?.period_start) return false;
  const start = new Date(`${period.period_start}T00:00:00Z`);
  return start.getUTCFullYear() === year && start.getUTCMonth() + 1 === month;
}

function misSubmissionForProjectPeriod(
  submissions: MisRow[],
  projectId: string,
  year: number,
  month: number,
) {
  return submissions.find(
    (row) =>
      row.project_id === projectId &&
      periodMatchesYearMonth(row.mis_periods as { period_start?: string }, year, month),
  );
}

function isPendingMis(submission: MisRow | undefined) {
  if (!submission) return true;
  return submission.status === "draft" || submission.status === "submitted";
}

export async function loadEhsScoreBiDashboard(
  supabase: SupabaseClient,
  organizationId: string,
  input: {
    filters: EhsScoreBiFilters;
    businessUnits: HierarchyBu[];
    regions: HierarchyRegion[];
    sites: HierarchySite[];
    projects: HierarchyProject[];
  },
): Promise<EhsScoreBiDashboard> {
  const { filters, businessUnits, regions, sites, projects } = input;
  const buById = new Map(businessUnits.map((b) => [b.id, b.name]));
  const regionById = new Map(regions.map((r) => [r.id, r.name]));
  const siteById = new Map(sites.map((s) => [s.id, s]));

  const scopedProjects = resolveProjectScope(projects, sites, regions, filters);

  const [misRows, snapshotsResult] = await Promise.all([
    listMisSubmissions(supabase, organizationId, {
      businessUnitId: filters.businessUnitId,
      regionId: filters.regionId,
      projectId: filters.projectId,
    }).catch(() => [] as MisRow[]),
    supabase
      .from("ehs_score_snapshots")
      .select("id, overall_score, business_unit_id, region_id, site_id, ehs_score_periods:period_id(period_start)")
      .eq("organization_id", organizationId)
      .limit(200),
  ]);

  const snapshots = snapshotsResult.data ?? [];

  const assessmentRows: EhsAssessmentRow[] = scopedProjects.map((project) => {
    const site = project.site_id ? siteById.get(project.site_id) : undefined;
    const regionId = site?.region_id ?? null;
    const buId = project.business_unit_id ?? site?.business_unit_id ?? null;
    const submission = misSubmissionForProjectPeriod(misRows, project.id, filters.year, filters.month);

    return {
      businessUnitName: buId ? (buById.get(buId) ?? "—") : "—",
      regionName: regionId ? (regionById.get(regionId) ?? "—") : "—",
      projectName: project.name,
      pending: isPendingMis(submission) ? 1 : 0,
    };
  });

  const yearCounts = new Map<number, number>();
  for (const row of misRows) {
    if (row.status === "cancelled") continue;
    const periodStart = (row.mis_periods as { period_start?: string } | null)?.period_start;
    if (!periodStart) continue;
    const year = new Date(`${periodStart}T00:00:00Z`).getUTCFullYear();
    yearCounts.set(year, (yearCounts.get(year) ?? 0) + 1);
  }
  if (yearCounts.size === 0 && scopedProjects.length > 0) {
    yearCounts.set(filters.year, 0);
  }

  const yearlyBars: EhsScoreYearBar[] = [...yearCounts.entries()]
    .sort(([a], [b]) => a - b)
    .map(([year, count]) => ({ year: String(year), count }));

  let calculatedScore: Awaited<ReturnType<typeof calculateEhsScore>> | null = null;
  if (filters.projectId && scopedProjects.length === 1) {
    let regionSiteIds: string[] | null = null;
    if (filters.regionId) {
      regionSiteIds = sites.filter((s) => s.region_id === filters.regionId).map((s) => s.id);
    }
    calculatedScore = await calculateEhsScore(supabase, organizationId, {
      businessUnitId: filters.businessUnitId,
      regionId: filters.regionId,
      projectId: filters.projectId,
      regionSiteIds,
    });
  }

  const statusRows: EhsScoreStatusRow[] = [];
  for (const project of scopedProjects.slice(0, 50)) {
    const site = project.site_id ? siteById.get(project.site_id) : undefined;
    const regionId = site?.region_id ?? null;
    const buId = project.business_unit_id ?? site?.business_unit_id ?? null;
    const submission = misSubmissionForProjectPeriod(misRows, project.id, filters.year, filters.month);

    const snapshot =
      snapshots.find((s) => s.site_id && s.site_id === project.site_id) ??
      snapshots.find((s) => s.region_id && s.region_id === regionId) ??
      snapshots.find((s) => s.business_unit_id && s.business_unit_id === buId);

    let overallScore: number | null = null;
    let status: EhsScoreStatusRow["status"] = "no_submission";
    let statusLabel = "No submission";

    if (submission) {
      if (submission.status === "approved") {
        const metrics = submission.metrics as { overallScore?: number; ehsScore?: number } | null;
        overallScore =
          typeof metrics?.overallScore === "number"
            ? metrics.overallScore
            : typeof metrics?.ehsScore === "number"
              ? metrics.ehsScore
              : snapshot
                ? Number(snapshot.overall_score)
                : calculatedScore?.overall ?? null;
        status =
          overallScore !== null
            ? "calculated"
            : calculatedScore?.status === "insufficient_data"
              ? "insufficient_data"
              : "pending_mis";
        statusLabel =
          overallScore !== null
            ? `Score ${overallScore}`
            : calculatedScore?.status === "insufficient_data"
              ? "Insufficient data"
              : "Approved — score pending";
      } else if (submission.status === "draft" || submission.status === "submitted") {
        status = "pending_mis";
        statusLabel = submission.status === "draft" ? "MIS draft" : "MIS submitted";
      } else {
        statusLabel = submission.status;
      }
    } else if (filters.projectId === project.id && calculatedScore) {
      overallScore = calculatedScore.overall;
      status = calculatedScore.status;
      statusLabel =
        calculatedScore.status === "insufficient_data"
          ? "Insufficient data"
          : calculatedScore.overall !== null
            ? `Score ${calculatedScore.overall}`
            : "Insufficient data";
    } else if (snapshot) {
      overallScore = Number(snapshot.overall_score);
      status = overallScore !== null ? "calculated" : "insufficient_data";
      statusLabel = overallScore !== null ? `Score ${overallScore}` : "Insufficient data";
    }

    statusRows.push({
      id: submission?.submission_number ?? "—",
      businessUnitName: buId ? (buById.get(buId) ?? "—") : "—",
      regionName: regionId ? (regionById.get(regionId) ?? "—") : "—",
      projectName: project.name,
      location: site?.name ?? "—",
      overallScore,
      status,
      statusLabel,
    });
  }

  const dataNote =
    scopedProjects.length === 0
      ? "No projects match the selected BU, region, and project filters."
      : misRows.length === 0 && snapshots.length === 0
        ? "No MIS submissions or published score snapshots yet — counts reflect pending assessments only."
        : scopedProjects.length > 50
          ? "Status table shows the first 50 projects in scope."
          : null;

  return {
    filters,
    periodLabel: ehsScoreBiPeriodLabel(filters.year, filters.month),
    assessmentRows,
    yearlyBars,
    statusRows,
    dataNote,
  };
}

