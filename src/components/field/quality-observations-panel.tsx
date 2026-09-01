"use client";

import Link from "next/link";
import { Fragment, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Minus,
  Plus,
  Printer,
  RefreshCw,
  Search,
} from "lucide-react";
import {
  fieldControlClass,
  fieldRakshaBtnClass,
  fieldSecondaryBtnClass,
  FieldCard,
  FieldEmpty,
} from "@/components/field/field-ui";
import type { QualityObservationFilters, QualityObservationRow } from "@/lib/services/quality-observations";
import {
  filterQualityObservationRows,
  formatQualityObservationDate,
  groupQualityObservations,
  qualityObservationDetailPath,
} from "@/lib/services/quality-observations";

type Option = { id: string; name: string };

type Props = {
  rows: QualityObservationRow[];
  businessUnits: Option[];
  regions: Option[];
  projects: Option[];
  initialFilters: QualityObservationFilters;
};

const PAGE_SIZES = [10, 25, 50, 100];
const ZOOM_LEVELS = [75, 100, 125, 150];

function StatusPill({ label }: { label: string }) {
  const open = label === "Open";
  return (
    <span
      className={`inline-flex rounded px-2 py-0.5 text-xs font-semibold ${
        open ? "bg-teal-600 text-white" : "border border-border bg-muted text-foreground"
      }`}
    >
      {label}
    </span>
  );
}

function exportCsv(rows: QualityObservationRow[]) {
  const headers = [
    "Sr No",
    "Location No",
    "Category",
    "Subcategory",
    "Description",
    "Status",
    "Reported By",
    "Created On",
    "Closed By",
    "Closed On",
    "SBU",
    "Region",
    "Project",
  ];
  const lines = rows.map((row) =>
    [
      row.eventNumber,
      row.locationNo ?? "",
      row.categoryName ?? "",
      row.subcategoryName ?? "",
      row.description.replace(/"/g, '""'),
      row.statusLabel,
      row.reportedByName,
      formatQualityObservationDate(row.createdOn),
      row.closedByName ?? "",
      formatQualityObservationDate(row.closedOn),
      row.businessUnitName ?? "",
      row.regionName ?? "",
      row.projectName ?? "",
    ]
      .map((v) => `"${v}"`)
      .join(","),
  );
  const blob = new Blob([[headers.join(","), ...lines].join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `quality-observations-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function QualityObservationsPanel({
  rows,
  businessUnits,
  regions,
  projects,
  initialFilters,
}: Props) {
  const router = useRouter();
  const [draft, setDraft] = useState<QualityObservationFilters>(initialFilters);
  const [filters, setFilters] = useState<QualityObservationFilters>(initialFilters);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [zoom, setZoom] = useState(100);
  const [findQuery, setFindQuery] = useState("");
  const [findIndex, setFindIndex] = useState(0);
  const [expandedBu, setExpandedBu] = useState<Record<string, boolean>>({});
  const [expandedRegion, setExpandedRegion] = useState<Record<string, boolean>>({});
  const [expandedProject, setExpandedProject] = useState<Record<string, boolean>>({});
  const [expandedCategory, setExpandedCategory] = useState<Record<string, boolean>>({});

  const filtered = useMemo(
    () => filterQualityObservationRows(rows, filters),
    [rows, filters],
  );

  const findMatches = useMemo(() => {
    const needle = findQuery.trim().toLowerCase();
    if (!needle) return [];
    return filtered.filter(
      (row) =>
        row.eventNumber.toLowerCase().includes(needle) ||
        row.description.toLowerCase().includes(needle) ||
        row.reportedByName.toLowerCase().includes(needle) ||
        (row.locationNo?.toLowerCase().includes(needle) ?? false),
    );
  }, [filtered, findQuery]);

  const grouped = useMemo(() => groupQualityObservations(filtered), [filtered]);

  const flatRows = useMemo(() => {
    const out: QualityObservationRow[] = [];
    for (const bu of grouped) {
      for (const region of bu.regions) {
        for (const project of region.projects) {
          for (const category of project.categories) {
            out.push(...category.rows);
          }
        }
      }
    }
    return out;
  }, [grouped]);

  const totalPages = Math.max(1, Math.ceil(flatRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = flatRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageRowIds = new Set(pageRows.map((r) => r.id));

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters(draft);
    setPage(1);
  }

  function onReset() {
    const cleared: QualityObservationFilters = {};
    setDraft(cleared);
    setFilters(cleared);
    setPage(1);
    setFindQuery("");
    setFindIndex(0);
  }

  function onFindNext() {
    if (!findMatches.length) return;
    const next = (findIndex + 1) % findMatches.length;
    setFindIndex(next);
    const match = findMatches[next];
    if (!match) return;
    const idx = flatRows.findIndex((r) => r.id === match.id);
    if (idx >= 0) setPage(Math.floor(idx / pageSize) + 1);
  }

  const highlightId = findMatches[findIndex]?.id;

  return (
    <div className="space-y-4 print:space-y-2">
      <FieldCard className="print:hidden">
        <form onSubmit={onSearch} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">SBU</span>
              <select
                value={draft.businessUnitId ?? ""}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, businessUnitId: e.target.value || undefined }))
                }
                className={fieldControlClass}
              >
                <option value="">All SBUs</option>
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
                onChange={(e) => setDraft((f) => ({ ...f, regionId: e.target.value || undefined }))}
                className={fieldControlClass}
              >
                <option value="">All regions</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Project</span>
              <select
                value={draft.projectId ?? ""}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, projectId: e.target.value || undefined }))
                }
                className={fieldControlClass}
              >
                <option value="">All projects</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">From Date</span>
              <input
                type="date"
                value={draft.fromDate ?? ""}
                onChange={(e) => setDraft((f) => ({ ...f, fromDate: e.target.value || undefined }))}
                className={fieldControlClass}
              />
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">To Date</span>
              <input
                type="date"
                value={draft.toDate ?? ""}
                onChange={(e) => setDraft((f) => ({ ...f, toDate: e.target.value || undefined }))}
                className={fieldControlClass}
              />
            </label>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <button type="submit" className={fieldRakshaBtnClass}>
              Search
            </button>
            <button type="button" onClick={onReset} className={fieldSecondaryBtnClass}>
              Reset
            </button>
          </div>
        </form>
      </FieldCard>

      <FieldCard className="print:hidden">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-border hover:bg-muted"
              onClick={() => setPage(1)}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-border hover:bg-muted"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="px-2 text-xs text-muted-foreground">
              {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-border hover:bg-muted"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded border border-border hover:bg-muted"
              onClick={() => setPage(totalPages)}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>

          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-9 rounded border border-border bg-card px-2 text-xs"
            aria-label="Page size"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex h-9 items-center gap-1 rounded border border-border px-2 hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <select
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="h-9 rounded border border-border bg-card px-2 text-xs"
            aria-label="Zoom"
          >
            {ZOOM_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}%
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            className="inline-flex h-9 items-center gap-1 rounded border border-border px-2 hover:bg-muted"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-9 items-center gap-1 rounded border border-border px-2 hover:bg-muted"
          >
            <Printer className="h-4 w-4" />
            <span className="hidden sm:inline">Print</span>
          </button>

          <div className="flex flex-1 items-center gap-1 sm:min-w-[200px]">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              value={findQuery}
              onChange={(e) => {
                setFindQuery(e.target.value);
                setFindIndex(0);
              }}
              placeholder="Find"
              className="h-9 min-w-0 flex-1 rounded border border-border bg-card px-2 text-xs"
            />
            <button
              type="button"
              onClick={onFindNext}
              className="h-9 rounded border border-border px-2 text-xs hover:bg-muted"
            >
              Next
            </button>
          </div>
        </div>
      </FieldCard>

      {flatRows.length ? (
        <>
          <div
            className="hidden origin-top-left overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-sm)] lg:block print:block print:overflow-visible print:shadow-none"
            style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}
          >
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <th className="px-3 py-2">Sr No</th>
                  <th className="px-3 py-2">Location No</th>
                  <th className="px-3 py-2">Category</th>
                  <th className="px-3 py-2">Subcategory</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Reported By</th>
                  <th className="px-3 py-2">Created On</th>
                  <th className="px-3 py-2">Closed By</th>
                  <th className="px-3 py-2">Closed On</th>
                </tr>
              </thead>
              <tbody>
                {grouped.map((bu) => {
                  const buKey = bu.businessUnitName;
                  const buCount = bu.regions.reduce(
                    (sum, r) =>
                      sum +
                      r.projects.reduce(
                        (pSum, p) =>
                          pSum + p.categories.reduce((cSum, c) => cSum + c.rows.length, 0),
                        0,
                      ),
                    0,
                  );
                  const buVisible = bu.regions.some((r) =>
                    r.projects.some((p) =>
                      p.categories.some((c) => c.rows.some((row) => pageRowIds.has(row.id))),
                    ),
                  );
                  if (!buVisible && pageRowIds.size > 0) return null;

                  const buOpen = expandedBu[buKey] ?? true;
                  return (
                    <Fragment key={buKey}>
                      <tr className="bg-[#3d3d3d] text-white">
                        <td colSpan={10} className="px-3 py-2 font-semibold">
                          <button
                            type="button"
                            className="inline-flex items-center gap-1"
                            onClick={() => setExpandedBu((s) => ({ ...s, [buKey]: !buOpen }))}
                          >
                            {buOpen ? <Minus className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                            {bu.businessUnitName} ({buCount})
                          </button>
                        </td>
                      </tr>
                      {buOpen
                        ? bu.regions.map((region) => {
                            const regionKey = `${buKey}::${region.regionName}`;
                            const regionCount = region.projects.reduce(
                              (sum, p) =>
                                sum + p.categories.reduce((cSum, c) => cSum + c.rows.length, 0),
                              0,
                            );
                            const regionVisible = region.projects.some((p) =>
                              p.categories.some((c) => c.rows.some((row) => pageRowIds.has(row.id))),
                            );
                            if (!regionVisible && pageRowIds.size > 0) return null;

                            const regionOpen = expandedRegion[regionKey] ?? true;
                            return (
                              <Fragment key={regionKey}>
                                <tr className="bg-[#6b6b6b] text-white">
                                  <td colSpan={10} className="px-3 py-2 pl-6 font-medium">
                                    <button
                                      type="button"
                                      className="inline-flex items-center gap-1"
                                      onClick={() =>
                                        setExpandedRegion((s) => ({
                                          ...s,
                                          [regionKey]: !regionOpen,
                                        }))
                                      }
                                    >
                                      {regionOpen ? (
                                        <Minus className="h-3.5 w-3.5" />
                                      ) : (
                                        <Plus className="h-3.5 w-3.5" />
                                      )}
                                      {region.regionName} ({regionCount})
                                    </button>
                                  </td>
                                </tr>
                                {regionOpen
                                  ? region.projects.map((project) => {
                                      const projectKey = `${regionKey}::${project.projectName}`;
                                      const projectCount = project.categories.reduce(
                                        (sum, c) => sum + c.rows.length,
                                        0,
                                      );
                                      const projectVisible = project.categories.some((c) =>
                                        c.rows.some((row) => pageRowIds.has(row.id)),
                                      );
                                      if (!projectVisible && pageRowIds.size > 0) return null;

                                      const projectOpen = expandedProject[projectKey] ?? true;
                                      return (
                                        <Fragment key={projectKey}>
                                          <tr className="bg-[#9e9e9e] text-white">
                                            <td colSpan={10} className="px-3 py-2 pl-10 font-medium">
                                              <button
                                                type="button"
                                                className="inline-flex items-center gap-1"
                                                onClick={() =>
                                                  setExpandedProject((s) => ({
                                                    ...s,
                                                    [projectKey]: !projectOpen,
                                                  }))
                                                }
                                              >
                                                {projectOpen ? (
                                                  <Minus className="h-3.5 w-3.5" />
                                                ) : (
                                                  <Plus className="h-3.5 w-3.5" />
                                                )}
                                                {project.projectName} ({projectCount})
                                              </button>
                                            </td>
                                          </tr>
                                          {projectOpen
                                            ? project.categories.map((category) => {
                                                const categoryKey = `${projectKey}::${category.categoryGroup}`;
                                                const visibleRows = category.rows.filter(
                                                  (row) =>
                                                    pageRowIds.size === 0 || pageRowIds.has(row.id),
                                                );
                                                if (!visibleRows.length) return null;

                                                const categoryOpen =
                                                  expandedCategory[categoryKey] ?? true;
                                                return (
                                                  <Fragment key={categoryKey}>
                                                    <tr className="bg-[#b8d4e8] text-foreground">
                                                      <td colSpan={10} className="px-3 py-2 pl-14 font-semibold">
                                                        <button
                                                          type="button"
                                                          className="inline-flex items-center gap-1"
                                                          onClick={() =>
                                                            setExpandedCategory((s) => ({
                                                              ...s,
                                                              [categoryKey]: !categoryOpen,
                                                            }))
                                                          }
                                                        >
                                                          {categoryOpen ? (
                                                            <Minus className="h-3.5 w-3.5" />
                                                          ) : (
                                                            <Plus className="h-3.5 w-3.5" />
                                                          )}
                                                          {category.categoryGroup} ({visibleRows.length})
                                                        </button>
                                                      </td>
                                                    </tr>
                                                    {categoryOpen
                                                      ? visibleRows.map((row) => (
                                                          <tr
                                                            key={row.id}
                                                            className={`border-b border-border hover:bg-muted/20 ${
                                                              highlightId === row.id
                                                                ? "bg-amber-50 ring-1 ring-amber-300"
                                                                : ""
                                                            }`}
                                                          >
                                                            <td className="px-3 py-2">
                                                              <Link
                                                                href={qualityObservationDetailPath(row.id)}
                                                                className="font-medium text-[#2563eb] hover:underline"
                                                              >
                                                                {row.eventNumber}
                                                              </Link>
                                                            </td>
                                                            <td className="px-3 py-2">{row.locationNo ?? "—"}</td>
                                                            <td className="px-3 py-2">{row.categoryName ?? "—"}</td>
                                                            <td className="px-3 py-2">
                                                              {row.subcategoryName ?? "—"}
                                                            </td>
                                                            <td className="max-w-xs px-3 py-2">{row.description}</td>
                                                            <td className="px-3 py-2">
                                                              <StatusPill label={row.statusLabel} />
                                                            </td>
                                                            <td className="px-3 py-2">{row.reportedByName}</td>
                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                              {formatQualityObservationDate(row.createdOn)}
                                                            </td>
                                                            <td className="px-3 py-2">{row.closedByName ?? ""}</td>
                                                            <td className="px-3 py-2 whitespace-nowrap">
                                                              {formatQualityObservationDate(row.closedOn)}
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
                                    })
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

          <div className="space-y-2 lg:hidden print:hidden">
            {pageRows.map((row) => (
              <Link
                key={row.id}
                href={qualityObservationDetailPath(row.id)}
                className={`block rounded-[var(--radius-lg)] border border-border bg-card p-3.5 shadow-[var(--shadow-sm)] ${
                  highlightId === row.id ? "ring-2 ring-amber-300" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#2563eb]">{row.eventNumber}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {row.businessUnitName} · {row.regionName}
                    </p>
                  </div>
                  <StatusPill label={row.statusLabel} />
                </div>
                <p className="mt-2 text-sm font-medium">{row.projectName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {row.categoryName}
                  {row.subcategoryName ? ` / ${row.subcategoryName}` : ""}
                  {row.locationNo ? ` · Loc ${row.locationNo}` : ""}
                </p>
                <p className="mt-2 line-clamp-3 text-sm">{row.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {row.reportedByName} · {formatQualityObservationDate(row.createdOn)}
                </p>
              </Link>
            ))}
          </div>
        </>
      ) : (
        <FieldEmpty text="No quality observations match your filters." />
      )}

      {filtered.length > 0 ? (
        <p className="text-center text-xs text-muted-foreground print:hidden">
          Showing {flatRows.length} observation{flatRows.length === 1 ? "" : "s"}
          {findMatches.length > 0 ? ` · ${findMatches.length} find match(es)` : ""}
        </p>
      ) : null}
    </div>
  );
}
