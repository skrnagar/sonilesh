"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Eye, LayoutGrid } from "lucide-react";
import {
  fieldControlClass,
  fieldPrimaryBtnClass,
  fieldPrimaryBtnInlineClass,
  fieldSecondaryBtnClass,
  fieldIconBtnClass,
  FieldCard,
  FieldEmpty,
  FieldStatusPill,
} from "@/components/field/field-ui";
import type { UaucListFilters, UaucListRow } from "@/lib/services/uauc-list";
import { formatDateTime } from "@/lib/utils";

type Option = { id: string; name: string };

type SortKey =
  | "eventNumber"
  | "occurredAt"
  | "reportedAt"
  | "description"
  | "createdByName"
  | "actionItemCount"
  | "statusLabel";

type Props = {
  rows: UaucListRow[];
  businessUnits: Option[];
  regions: Option[];
  projects: Option[];
  initialFilters: UaucListFilters;
  isDemoPreview?: boolean;
};

function UaucStatusPill({ label }: { label: string }) {
  return (
    <FieldStatusPill
      label={label}
      tone={label === "Open" ? "open" : label === "Closed" ? "closed" : "neutral"}
    />
  );
}

export function UaucListPanel({
  rows,
  businessUnits,
  regions,
  projects,
  initialFilters,
  isDemoPreview = false,
}: Props) {
  const [filters, setFilters] = useState<UaucListFilters>(initialFilters);
  const [draft, setDraft] = useState<UaucListFilters>(initialFilters);
  const [sortKey, setSortKey] = useState<SortKey>("occurredAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    return rows.filter((row) => {
      if (draft.businessUnitId && row.businessUnitId !== draft.businessUnitId) return false;
      if (draft.regionId && row.regionId !== draft.regionId) return false;
      if (draft.projectId && row.projectId !== draft.projectId) return false;
      if (draft.incidentType) {
        const normalized =
          draft.incidentType === "ua"
            ? "unsafe_act"
            : draft.incidentType === "uc"
              ? "unsafe_condition"
              : draft.incidentType === "wsn"
                ? "safety_observation"
                : draft.incidentType;
        if (row.incidentTypeCode !== normalized) return false;
      }
      if (draft.status === "open" && row.statusLabel !== "Open") return false;
      if (draft.status === "closed" && row.statusLabel !== "Closed") return false;
      if (
        draft.status &&
        !["open", "closed"].includes(draft.status) &&
        row.status !== draft.status
      ) {
        return false;
      }
      if (draft.serialNumber?.trim()) {
        const needle = draft.serialNumber.trim().toLowerCase();
        if (!row.eventNumber.toLowerCase().includes(needle)) return false;
      }
      return true;
    });
  }, [rows, draft]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      if (typeof av === "number" && typeof bv === "number") {
        return sortDir === "asc" ? av - bv : bv - av;
      }
      const as = String(av ?? "");
      const bs = String(bv ?? "");
      return sortDir === "asc" ? as.localeCompare(bs) : bs.localeCompare(as);
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir(key === "occurredAt" || key === "reportedAt" ? "desc" : "asc");
  }

  function SortIcon({ column }: { column: SortKey }) {
    if (sortKey !== column) return <ArrowUpDown className="ml-1 inline h-3.5 w-3.5 opacity-50" />;
    return sortDir === "asc" ? (
      <ArrowUp className="ml-1 inline h-3.5 w-3.5" />
    ) : (
      <ArrowDown className="ml-1 inline h-3.5 w-3.5" />
    );
  }

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    setFilters(draft);
  }

  function onReset() {
    const cleared: UaucListFilters = {};
    setDraft(cleared);
    setFilters(cleared);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div />
        <Link href="/field/ua-uc/new" className={fieldPrimaryBtnInlineClass}>
          Report UA/UC/WSN
        </Link>
      </div>

      <FieldCard>
        <form onSubmit={onSearch} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Business Unit</span>
              <select
                value={draft.businessUnitId ?? ""}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, businessUnitId: e.target.value || undefined }))
                }
                className={fieldControlClass}
              >
                <option value="">All business units</option>
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
              <span className="text-xs font-semibold text-muted-foreground">Incident Type</span>
              <select
                value={draft.incidentType ?? ""}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, incidentType: e.target.value || undefined }))
                }
                className={fieldControlClass}
              >
                <option value="">Select Incident Type</option>
                <option value="ua">UA</option>
                <option value="uc">UC</option>
                <option value="wsn">WSN</option>
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-muted-foreground">Status</span>
              <select
                value={draft.status ?? ""}
                onChange={(e) => setDraft((f) => ({ ...f, status: e.target.value || undefined }))}
                className={fieldControlClass}
              >
                <option value="">Select Status</option>
                <option value="open">Open</option>
                <option value="closed">Closed</option>
                <option value="submitted">Submitted</option>
                <option value="draft">Draft</option>
              </select>
            </label>
            <label className="block space-y-1 sm:col-span-2">
              <span className="text-xs font-semibold text-muted-foreground">Sr. No.</span>
              <input
                value={draft.serialNumber ?? ""}
                onChange={(e) =>
                  setDraft((f) => ({ ...f, serialNumber: e.target.value || undefined }))
                }
                placeholder="Sr. No."
                className={fieldControlClass}
              />
            </label>
            <div className="flex items-end gap-2">
              <button type="submit" className={`${fieldPrimaryBtnInlineClass} flex-1`}>
                Search
              </button>
              <button type="button" onClick={onReset} className={`${fieldSecondaryBtnClass} flex-1`}>
                Reset
              </button>
            </div>
          </div>
        </form>
      </FieldCard>

      {sorted.length ? (
        <>
          <div className="hidden overflow-x-auto rounded-[var(--radius-lg)] border border-border bg-card shadow-[var(--shadow-sm)] lg:block">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-border bg-muted/40 text-xs uppercase text-muted-foreground">
                <tr>
                  {(
                    [
                      ["eventNumber", "UA/UC NO"],
                      ["occurredAt", "Incident Date"],
                      ["reportedAt", "Incident Report On"],
                      ["description", "Incident Description"],
                      ["createdByName", "Created By"],
                      ["actionItemCount", "Action Items"],
                      ["statusLabel", "Status"],
                    ] as const
                  ).map(([key, label]) => (
                    <th key={key} className="px-3 py-2.5 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSort(key)}
                        className="inline-flex items-center hover:text-foreground"
                      >
                        {label}
                        <SortIcon column={key} />
                      </button>
                    </th>
                  ))}
                  <th className="px-3 py-2.5 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                    <td className="px-3 py-3 font-medium">{row.eventNumber}</td>
                    <td className="px-3 py-3 whitespace-nowrap">{formatDateTime(row.occurredAt)}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {formatDateTime(row.reportedAt)}
                    </td>
                    <td className="max-w-xs truncate px-3 py-3">{row.description}</td>
                    <td className="px-3 py-3">{row.createdByName}</td>
                    <td className="px-3 py-3">({row.actionItemCount})</td>
                    <td className="px-3 py-3">
                      <UaucStatusPill label={row.statusLabel} />
                    </td>
                    <td className="px-3 py-3">
                      {isDemoPreview ? (
                        <span
                          className={`${fieldIconBtnClass} pointer-events-none opacity-60`}
                          aria-hidden
                        >
                          <Eye className="h-4 w-4" />
                        </span>
                      ) : (
                        <Link
                          href={`/field/ua-uc/${row.id}`}
                          aria-label={`View ${row.eventNumber}`}
                          className={fieldIconBtnClass}
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 lg:hidden">
            {sorted.map((row) =>
              isDemoPreview ? (
                <div
                  key={row.id}
                  className="block rounded-[var(--radius-lg)] border border-border bg-card p-3.5 shadow-[var(--shadow-sm)]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-foreground">{row.eventNumber}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatDateTime(row.occurredAt)}
                      </p>
                    </div>
                    <UaucStatusPill label={row.statusLabel} />
                  </div>
                  <p className="mt-2 line-clamp-2 text-sm text-foreground">{row.description}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {row.createdByName} · Action items ({row.actionItemCount})
                  </p>
                </div>
              ) : (
                <Link
                  key={row.id}
                  href={`/field/ua-uc/${row.id}`}
                  className="block rounded-[var(--radius-lg)] border border-border bg-card p-3.5 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] hover:border-primary/30 hover:shadow-[var(--shadow-md)]"
                >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">{row.eventNumber}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {formatDateTime(row.occurredAt)}
                    </p>
                  </div>
                  <UaucStatusPill label={row.statusLabel} />
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-foreground">{row.description}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {row.createdByName} · Action items ({row.actionItemCount})
                </p>
                </Link>
              ),
            )}
          </div>
        </>
      ) : (
        <FieldEmpty text="No UA/UC/WSN reports match your filters." />
      )}

      {filters.serialNumber || filters.status || filters.incidentType ? (
        <p className="text-center text-xs text-muted-foreground">
          Showing {sorted.length} result{sorted.length === 1 ? "" : "s"}
        </p>
      ) : null}

      <Link
        href="/field/ua-uc/new"
        className={`${fieldPrimaryBtnClass} hidden items-center justify-center gap-2 lg:inline-flex`}
      >
        <LayoutGrid className="h-4 w-4" />
        New report
      </Link>
    </div>
  );
}
