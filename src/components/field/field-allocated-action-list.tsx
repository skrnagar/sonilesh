"use client";

import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, X } from "lucide-react";
import {
  completeFieldActionItemAction,
  completeFieldCapaAction,
} from "@/app/actions/field";
import { ActionCompleteCard, CapaCompleteCard } from "@/components/field/field-submit-form";
import { FieldEmpty, FieldStatusPill } from "@/components/field/field-ui";
import {
  formatFieldActionDate,
  type AllocatedActionRow,
} from "@/lib/field/allocated-actions";

type SortKey =
  | "actionItem"
  | "actionType"
  | "allocatedBy"
  | "incidentRef"
  | "allocatedOn"
  | "expectedDueDate"
  | "status";

const PAGE_SIZES = [10, 25, 50];

function ActionStatusPill({ label }: { label: "Open" | "Closed" }) {
  return <FieldStatusPill label={label} tone={label === "Open" ? "open" : "closed"} />;
}

function SortButton({
  column,
  label,
  sortKey,
  sortDir,
  onSort,
}: {
  column: SortKey;
  label: string;
  sortKey: SortKey;
  sortDir: "asc" | "desc";
  onSort: (key: SortKey) => void;
}) {
  const active = sortKey === column;
  const Icon = active ? (sortDir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 font-semibold text-foreground hover:text-primary"
    >
      {label}
      <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
    </button>
  );
}

export function FieldAllocatedActionList({
  rows,
  isDemoPreview = false,
}: {
  rows: AllocatedActionRow[];
  isDemoPreview?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>("allocatedOn");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [editing, setEditing] = useState<AllocatedActionRow | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      [
        row.actionItem,
        row.actionType,
        row.allocatedBy,
        row.incidentRef,
        row.status,
        formatFieldActionDate(row.allocatedOn),
        formatFieldActionDate(row.expectedDueDate),
      ]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    const copy = [...filtered];
    copy.sort((a, b) => {
      let av: string | number = "";
      let bv: string | number = "";
      switch (sortKey) {
        case "allocatedOn":
          av = new Date(a.allocatedOn).getTime();
          bv = new Date(b.allocatedOn).getTime();
          break;
        case "expectedDueDate":
          av = a.expectedDueDate ? new Date(a.expectedDueDate).getTime() : 0;
          bv = b.expectedDueDate ? new Date(b.expectedDueDate).getTime() : 0;
          break;
        case "status":
          av = a.statusLabel;
          bv = b.statusLabel;
          break;
        default:
          av = String(a[sortKey]).toLowerCase();
          bv = String(b[sortKey]).toLowerCase();
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return copy;
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageRows = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  function onSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <label htmlFor="action-page-size" className="whitespace-nowrap">Show</label>
          <select
            id="action-page-size"
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(0);
            }}
            className="min-h-10 rounded border border-border bg-card px-2 text-sm text-foreground"
          >
            {PAGE_SIZES.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span>entries</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="action-search" className="text-muted-foreground">Search:</label>
          <input
            id="action-search"
            type="search"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="min-h-10 w-full min-w-[12rem] rounded border border-border bg-card px-3 text-sm sm:w-56"
            placeholder="Filter actions…"
          />
        </div>
      </div>

      {!sorted.length ? (
        <FieldEmpty text="No allocated actions found." />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border bg-card shadow-[var(--shadow-sm)]">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-border bg-muted/40">
              <tr>
                {[
                  { key: "actionItem" as SortKey, label: "Action Item" },
                  { key: "actionType" as SortKey, label: "Action Type" },
                  { key: "allocatedBy" as SortKey, label: "Allocated by" },
                  { key: "incidentRef" as SortKey, label: "Incident" },
                  { key: "allocatedOn" as SortKey, label: "Allocated On" },
                  { key: "expectedDueDate" as SortKey, label: "Expected Due Date" },
                  { key: "status" as SortKey, label: "Status" },
                ].map((col) => (
                  <th key={col.key} className="px-3 py-2.5 align-top">
                    <SortButton
                      column={col.key}
                      label={col.label}
                      sortKey={sortKey}
                      sortDir={sortDir}
                      onSort={onSort}
                    />
                  </th>
                ))}
                <th className="px-3 py-2.5 font-semibold text-foreground">Update Status</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row) => (
                <tr key={`${row.kind}-${row.id}`} className="border-b border-border last:border-0">
                  <td className="px-3 py-3 align-top text-foreground">{row.actionItem}</td>
                  <td className="px-3 py-3 align-top capitalize text-foreground">{row.actionType}</td>
                  <td className="px-3 py-3 align-top text-foreground">{row.allocatedBy}</td>
                  <td className="px-3 py-3 align-top text-foreground">{row.incidentRef}</td>
                  <td className="px-3 py-3 align-top text-foreground">
                    {formatFieldActionDate(row.allocatedOn)}
                  </td>
                  <td className="px-3 py-3 align-top text-foreground">
                    {formatFieldActionDate(row.expectedDueDate)}
                  </td>
                  <td className="px-3 py-3 align-top">
                    <ActionStatusPill label={row.statusLabel} />
                  </td>
                  <td className="px-3 py-3 align-top">
                    {row.canUpdate && !isDemoPreview ? (
                      <button
                        type="button"
                        onClick={() => setEditing(row)}
                        aria-label={`Update ${row.actionItem}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-primary/30 bg-primary/10 text-primary transition-colors hover:bg-primary/15"
                      >
                        <Pencil className="h-4 w-4" aria-hidden />
                      </button>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sorted.length > pageSize ? (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sorted.length)} of{" "}
            {sorted.length}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded border border-border px-3 py-1 disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      {editing ? (
        <div
          className="fixed inset-0 z-30 flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="action-update-title"
        >
          <div className="w-full max-w-lg rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-md)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 id="action-update-title" className="text-lg font-semibold text-foreground">
                  Update action
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{editing.actionItem}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditing(null)}
                aria-label="Close"
                className="rounded border border-border p-1.5 text-muted-foreground hover:bg-muted"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </div>
            {editing.kind === "capa" ? (
              <CapaCompleteCard
                id={editing.id}
                title={editing.actionItem}
                meta={`${editing.status} · due ${editing.expectedDueDate ?? "—"}`}
                action={completeFieldCapaAction}
              />
            ) : (
              <ActionCompleteCard
                id={editing.id}
                title={editing.actionItem}
                meta={`${editing.status} · due ${editing.expectedDueDate ?? "—"}`}
                action={completeFieldActionItemAction}
              />
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
