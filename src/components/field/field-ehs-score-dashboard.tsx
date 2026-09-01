"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus, X } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  fieldControlClass,
  fieldRakshaBtnClass,
  FieldCard,
  FieldEmpty,
} from "@/components/field/field-ui";
import type { EhsScoreBiDashboard } from "@/lib/ehs-score/bi";
import { MONTH_LABELS } from "@/lib/ehs-score/bi";

type Option = { id: string; name: string };
type RegionOption = Option & { business_unit_id?: string | null };
type ProjectOption = Option & { site_id?: string | null; business_unit_id?: string | null };
type SiteOption = Option & { region_id?: string | null; business_unit_id?: string | null };

type Props = {
  dashboard: EhsScoreBiDashboard;
  businessUnits: Option[];
  regions: RegionOption[];
  sites: SiteOption[];
  projects: ProjectOption[];
};

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const GRID = { stroke: "var(--border)", strokeDasharray: "3 3" };
const TOOLTIP = {
  contentStyle: {
    background: "var(--card)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    color: "var(--foreground)",
    boxShadow: "var(--shadow-md)",
  },
};

function buildQuery(filters: {
  businessUnitId?: string;
  regionId?: string;
  projectId?: string;
  year: number;
  month: number;
}) {
  const params = new URLSearchParams();
  if (filters.businessUnitId) params.set("businessUnitId", filters.businessUnitId);
  if (filters.regionId) params.set("regionId", filters.regionId);
  if (filters.projectId) params.set("projectId", filters.projectId);
  params.set("year", String(filters.year));
  params.set("month", String(filters.month));
  return params.toString();
}

function PeriodPill({
  label,
  value,
  onClear,
}: {
  label: string;
  value: string;
  onClear: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-sm shadow-[var(--shadow-sm)]">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
      <button
        type="button"
        onClick={onClear}
        className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
        aria-label={`Clear ${label.toLowerCase()}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </span>
  );
}

function AssessmentTable({ rows }: { rows: EhsScoreBiDashboard["assessmentRows"] }) {
  const [expandedBu, setExpandedBu] = useState<Record<string, boolean>>({});
  const [expandedRegion, setExpandedRegion] = useState<Record<string, boolean>>({});

  const grouped = useMemo(() => {
    const buMap = new Map<
      string,
      {
        name: string;
        pending: number;
        regions: Map<
          string,
          {
            name: string;
            pending: number;
            projects: typeof rows;
          }
        >;
      }
    >();

    for (const row of rows) {
      const buKey = row.businessUnitName;
      if (!buMap.has(buKey)) {
        buMap.set(buKey, { name: buKey, pending: 0, regions: new Map() });
      }
      const bu = buMap.get(buKey)!;
      bu.pending += row.pending;

      const regionKey = `${buKey}::${row.regionName}`;
      if (!bu.regions.has(regionKey)) {
        bu.regions.set(regionKey, { name: row.regionName, pending: 0, projects: [] });
      }
      const region = bu.regions.get(regionKey)!;
      region.pending += row.pending;
      region.projects.push(row);
    }

    return [...buMap.values()];
  }, [rows]);

  if (!rows.length) {
    return <FieldEmpty text="No projects in scope for the selected filters." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <th className="px-3 py-2.5">SBU</th>
            <th className="px-3 py-2.5">Region</th>
            <th className="px-3 py-2.5">Project</th>
            <th className="px-3 py-2.5 text-right">Pending</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((bu) => {
            const buOpen = expandedBu[bu.name] ?? true;
            return bu.regions.size === 1 && bu.regions.values().next().value?.projects.length === 1 ? (
              bu.regions.values().next().value!.projects.map((row) => (
                <tr key={`${row.businessUnitName}-${row.regionName}-${row.projectName}`} className="border-b border-border/70">
                  <td className="px-3 py-2.5">{row.businessUnitName}</td>
                  <td className="px-3 py-2.5">{row.regionName}</td>
                  <td className="px-3 py-2.5">{row.projectName}</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{row.pending}</td>
                </tr>
              ))
            ) : (
              <Fragment key={bu.name}>
                <tr className="border-b border-border/70 bg-muted/20">
                  <td className="px-3 py-2.5">
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 font-medium"
                      onClick={() => setExpandedBu((s) => ({ ...s, [bu.name]: !buOpen }))}
                    >
                      {buOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                      {bu.name}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground">—</td>
                  <td className="px-3 py-2.5 text-muted-foreground">—</td>
                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">{bu.pending}</td>
                </tr>
                {buOpen
                  ? [...bu.regions.entries()].map(([regionKey, region]) => {
                      const regionOpen = expandedRegion[regionKey] ?? true;
                      return (
                        <Fragment key={regionKey}>
                          <tr className="border-b border-border/70">
                            <td className="px-3 py-2.5 pl-8 text-muted-foreground"> </td>
                            <td className="px-3 py-2.5">
                              <button
                                type="button"
                                className="inline-flex items-center gap-1 font-medium"
                                onClick={() =>
                                  setExpandedRegion((s) => ({ ...s, [regionKey]: !regionOpen }))
                                }
                              >
                                {regionOpen ? (
                                  <Minus className="h-3.5 w-3.5" />
                                ) : (
                                  <Plus className="h-3.5 w-3.5" />
                                )}
                                {region.name}
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-muted-foreground">—</td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                              {region.pending}
                            </td>
                          </tr>
                          {regionOpen
                            ? region.projects.map((row) => (
                                <tr
                                  key={`${row.businessUnitName}-${row.regionName}-${row.projectName}`}
                                  className="border-b border-border/70"
                                >
                                  <td className="px-3 py-2.5 pl-8" />
                                  <td className="px-3 py-2.5 pl-8" />
                                  <td className="px-3 py-2.5">{row.projectName}</td>
                                  <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                                    {row.pending}
                                  </td>
                                </tr>
                              ))
                            : null}
                        </Fragment>
                      );
                    })
                  : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function YearScoreChart({ data }: { data: EhsScoreBiDashboard["yearlyBars"] }) {
  const hasData = data.some((d) => d.count > 0);
  return (
    <div className="h-56 min-w-0 sm:h-64">
      {hasData ? (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 4, right: 24, top: 8, bottom: 8 }}>
            <CartesianGrid {...GRID} />
            <XAxis type="number" allowDecimals={false} tick={AXIS} label={{ value: "Count", position: "insideBottom", offset: -2, fontSize: 11 }} />
            <YAxis type="category" dataKey="year" width={48} tick={AXIS} label={{ value: "Year", angle: -90, position: "insideLeft", fontSize: 11 }} />
            <Tooltip {...TOOLTIP} />
            <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]}>
              <LabelList dataKey="count" position="right" fill="var(--foreground)" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
          No score submissions for the selected scope yet.
        </div>
      )}
    </div>
  );
}

export function FieldEhsScoreDashboard({
  dashboard,
  businessUnits,
  regions,
  sites,
  projects,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState(dashboard.filters);

  const filteredRegions = useMemo(() => {
    if (!draft.businessUnitId) return regions;
    return regions.filter((r) => r.business_unit_id === draft.businessUnitId);
  }, [regions, draft.businessUnitId]);

  const filteredProjects = useMemo(() => {
    const siteById = new Map(sites.map((s) => [s.id, s]));
    return projects.filter((project) => {
      if (draft.projectId && project.id !== draft.projectId) return false;
      const site = project.site_id ? siteById.get(project.site_id) : undefined;
      if (draft.regionId && site?.region_id !== draft.regionId) return false;
      if (draft.businessUnitId) {
        const buId = project.business_unit_id ?? site?.business_unit_id;
        if (buId !== draft.businessUnitId) return false;
      }
      return true;
    });
  }, [projects, sites, draft.businessUnitId, draft.regionId, draft.projectId]);

  const insufficientCount = dashboard.statusRows.filter(
    (r) => r.status === "insufficient_data",
  ).length;

  function onLoad(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/field/ehs-score?${buildQuery(draft)}`);
  }

  function resetPeriod() {
    const now = new Date();
    const next = {
      ...draft,
      year: now.getUTCFullYear(),
      month: now.getUTCMonth() + 1,
    };
    setDraft(next);
    router.push(`/field/ehs-score?${buildQuery(next)}`);
  }

  function clearYear() {
    resetPeriod();
  }

  function clearMonth() {
    resetPeriod();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Link
          href={`/app/ehs-score?${buildQuery(dashboard.filters)}`}
          className="inline-flex min-h-10 items-center rounded-[var(--radius-md)] bg-[var(--sidebar-active)] px-4 py-2 text-sm font-semibold text-primary-foreground shadow-[var(--shadow-sm)] hover:opacity-95"
        >
          MY BI
        </Link>
      </div>

      <FieldCard>
        <form onSubmit={onLoad} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Business Unit</span>
              <select
                value={draft.businessUnitId ?? ""}
                onChange={(e) =>
                  setDraft((f) => ({
                    ...f,
                    businessUnitId: e.target.value || undefined,
                    regionId: undefined,
                    projectId: undefined,
                  }))
                }
                className={fieldControlClass}
              >
                <option value="">Select business unit</option>
                {businessUnits.map((bu) => (
                  <option key={bu.id} value={bu.id}>
                    {bu.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Region</span>
              <select
                value={draft.regionId ?? ""}
                onChange={(e) =>
                  setDraft((f) => ({
                    ...f,
                    regionId: e.target.value || undefined,
                    projectId: undefined,
                  }))
                }
                className={fieldControlClass}
              >
                <option value="">Select region</option>
                {filteredRegions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 lg:col-span-1">
              <span className="text-xs font-semibold text-muted-foreground">Project</span>
              <select
                value={draft.projectId ?? ""}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, projectId: e.target.value || undefined }))
                }
                className={fieldControlClass}
              >
                <option value="">Select project</option>
                {filteredProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <button type="submit" className={`${fieldRakshaBtnClass} w-full bg-[#2563eb] hover:bg-[#1d4ed8]`}>
                Load
              </button>
            </div>
          </div>
        </form>
      </FieldCard>

      <div className="flex flex-wrap items-center gap-2">
        <PeriodPill label="Year" value={String(draft.year)} onClear={clearYear} />
        <PeriodPill
          label="Months"
          value={MONTH_LABELS[draft.month - 1] ?? String(draft.month)}
          onClear={clearMonth}
        />
        <label className="sr-only" htmlFor="ehs-score-year">
          Year
        </label>
        <select
          id="ehs-score-year"
          value={draft.year}
          onChange={(e) => setDraft((f) => ({ ...f, year: Number(e.target.value) }))}
          className="hidden"
        >
          {Array.from({ length: 6 }, (_, i) => new Date().getUTCFullYear() - i).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {dashboard.dataNote ? (
        <p className="rounded-[var(--radius-md)] border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          {dashboard.dataNote}
        </p>
      ) : null}

      {insufficientCount > 0 ? (
        <p className="rounded-[var(--radius-md)] border border-[var(--warning-soft)] bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning-ink)]">
          {insufficientCount} project{insufficientCount === 1 ? "" : "s"} have insufficient operational
          data for a calculated score in {dashboard.periodLabel}.
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <FieldCard className="p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">EHS Assessment</h2>
          </div>
          <div className="p-2 sm:p-3">
            <AssessmentTable rows={dashboard.assessmentRows} />
          </div>
        </FieldCard>

        <FieldCard className="p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold tracking-tight">EHS Score Per Year</h2>
          </div>
          <div className="p-2 sm:p-3">
            <YearScoreChart data={dashboard.yearlyBars} />
          </div>
        </FieldCard>
      </div>

      <FieldCard className="p-0">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-sm font-semibold tracking-tight">EHS Score Status</h2>
        </div>
        <div className="overflow-x-auto">
          {dashboard.statusRows.length ? (
            <>
              <table className="hidden w-full min-w-[640px] text-sm lg:table">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2.5">ID</th>
                    <th className="px-3 py-2.5">Business unit</th>
                    <th className="px-3 py-2.5">Region name</th>
                    <th className="px-3 py-2.5">Project name</th>
                    <th className="px-3 py-2.5">Location</th>
                    <th className="px-3 py-2.5">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.statusRows.map((row) => (
                    <tr
                      key={`${row.id}-${row.projectName}`}
                      className="border-b border-border/70 hover:bg-muted/20"
                    >
                      <td className="px-3 py-2.5 font-medium">{row.id}</td>
                      <td className="px-3 py-2.5">{row.businessUnitName}</td>
                      <td className="px-3 py-2.5">{row.regionName}</td>
                      <td className="px-3 py-2.5">{row.projectName}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{row.location}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{row.statusLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="space-y-2 p-3 lg:hidden">
                {dashboard.statusRows.map((row) => (
                  <div
                    key={`${row.id}-${row.projectName}-mobile`}
                    className="rounded-[var(--radius-md)] border border-border p-3"
                  >
                    <p className="font-medium">{row.projectName}</p>
                    <p className="text-xs text-muted-foreground">{row.id}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {row.businessUnitName} · {row.regionName} · {row.location}
                    </p>
                    <p className="mt-2 text-sm">{row.statusLabel}</p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="p-4">
              <FieldEmpty text="No score status records for the selected period and scope." />
            </div>
          )}
        </div>
      </FieldCard>
    </div>
  );
}
