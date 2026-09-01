import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleShell } from "@/components/modules/module-shell";
import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { ScopeFilters } from "@/components/dashboard/scope-filters";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { calculateEhsScore } from "@/lib/services/ehs-score";
import { Suspense } from "react";

export default async function EhsScorePage({
  searchParams,
}: {
  searchParams: Promise<{
    businessUnitId?: string;
    regionId?: string;
    projectId?: string;
    siteId?: string;
  }>;
}) {
  const params = await searchParams;
  const access = await requireModuleAccess({ permission: "score.view" });

  let regionSiteIds: string[] | null = null;
  if (params.regionId) {
    const { data: regionSites } = await access.supabase
      .from("sites")
      .select("id")
      .eq("organization_id", access.organization.id)
      .eq("region_id", params.regionId)
      .is("deleted_at", null)
      .limit(100);
    regionSiteIds = (regionSites ?? []).map((s) => s.id);
  }

  const score = await calculateEhsScore(access.supabase, access.organization.id, {
    ...params,
    regionSiteIds,
  });

  return (
    <ModuleShell
      title="EHS Scorecard"
      description="Dimensional EHS performance scoring with regional roll-up."
      permission="score.view"
    >
      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "EHS Scorecard" }]} className="mb-4" />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Suspense fallback={null}>
          <ScopeFilters
            params={{ ...params, range: "monthly" }}
            sites={access.sites}
            projects={access.projects}
            departments={[]}
            bus={access.businessUnits}
            regions={access.regions}
            severities={[]}
            owners={[]}
            actionPath="/app/ehs-score"
          />
        </Suspense>
        {score.status === "insufficient_data" ? (
          <Badge variant="secondary">
            INSUFFICIENT DATA — {score.dataCoverage.dataPoints}/{score.dataCoverage.minimumRequired} records · {score.periodLabel}
          </Badge>
        ) : (
          <Badge variant="outline">
            Calculated · {score.dataCoverage.dataPoints} records · {score.periodLabel}
          </Badge>
        )}
      </div>
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Overall EHS score"
          value={score.overall ?? "N/A"}
          hint={
            score.status === "insufficient_data"
              ? `Need ${score.dataCoverage.minimumRequired}+ operational records (have ${score.dataCoverage.dataPoints})`
              : `Weighted average · ${score.periodLabel}`
          }
          tone={
            score.overall === null
              ? "neutral"
              : score.overall >= 75
                ? "good"
                : score.overall >= 60
                  ? "watch"
                  : "critical"
          }
          href="/app/ehs-score"
          icon="Gauge"
          accent="green"
          trend={null}
          polarity="higher-is-better"
          spark={score.dimensions.map((d) => d.score ?? 0)}
        />
        {score.dimensions.map((dim) => {
          const dimScore = dim.score;
          return (
            <KpiCard
              key={dim.key}
              label={dim.label}
              value={dimScore ?? "N/A"}
              hint={dim.hint}
              tone={
                dimScore === null
                  ? "neutral"
                  : dimScore >= 75
                    ? "good"
                    : dimScore >= 60
                      ? "watch"
                      : "neutral"
              }
              href="/app/ehs-score"
              icon="BarChart3"
              accent="navy"
              trend={null}
              polarity="higher-is-better"
              spark={dimScore !== null ? [Math.max(0, dimScore - 10), dimScore] : [0, 0]}
            />
          );
        })}
      </div>
    </ModuleShell>
  );
}
