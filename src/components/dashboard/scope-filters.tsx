"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type Option = { id: string; name: string };

const EVENT_STATUSES = [
  "draft",
  "submitted",
  "triage",
  "investigation",
  "capa",
  "verification",
  "approval",
  "closed",
  "reopened",
  "cancelled",
];

export function ScopeFilters({
  params,
  sites,
  projects,
  departments,
  bus,
  severities,
  owners,
}: {
  params: {
    range?: string;
    siteId?: string;
    projectId?: string;
    departmentId?: string;
    businessUnitId?: string;
    severityId?: string;
    status?: string;
    ownerId?: string;
    dateFrom?: string;
    dateTo?: string;
  };
  sites: Option[];
  projects: Option[];
  departments: Option[];
  bus: Option[];
  severities: Option[];
  owners: Option[];
}) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    params.siteId,
    params.projectId,
    params.departmentId,
    params.businessUnitId,
    params.severityId,
    params.status,
    params.ownerId,
    params.dateFrom,
    params.dateTo,
  ].filter(Boolean).length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <Button type="button" variant="outline" className="h-11 min-h-11 rounded-xl" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filter
        {activeCount ? (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/40 backdrop-blur-[2px] sm:items-start sm:p-4 sm:pt-[8vh]"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="scope-filters-title"
            className="flex h-full w-full max-w-2xl flex-col overflow-y-auto rounded-none border-0 border-border bg-card p-4 shadow-[var(--shadow-lg)] sm:h-auto sm:max-h-[min(88vh,720px)] sm:rounded-2xl sm:border sm:p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="scope-filters-title" className="font-display text-lg font-semibold">
                  Dashboard filters
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tenant-scoped views by date, site, project, department, severity, status, owner, and business unit.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-11 w-11 min-h-11 min-w-11 shrink-0 items-center justify-center rounded-xl border border-border hover:bg-muted"
                aria-label="Close filters"
                onClick={() => setOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <form method="get" action="/app/dashboard" className="mt-5 grid gap-3 sm:grid-cols-2">
              <input type="hidden" name="range" value={params.range || "monthly"} />
              <label className="text-xs font-medium text-muted-foreground">
                From
                <Input type="date" name="dateFrom" defaultValue={params.dateFrom || ""} className="mt-1 rounded-xl" />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                To
                <Input type="date" name="dateTo" defaultValue={params.dateTo || ""} className="mt-1 rounded-xl" />
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Business unit
                <Select name="businessUnitId" defaultValue={params.businessUnitId || ""} className="mt-1 rounded-xl">
                  <option value="">All business units</option>
                  {bus.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Site
                <Select name="siteId" defaultValue={params.siteId || ""} className="mt-1 rounded-xl">
                  <option value="">All sites</option>
                  {sites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Project
                <Select name="projectId" defaultValue={params.projectId || ""} className="mt-1 rounded-xl">
                  <option value="">All projects</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Department
                <Select name="departmentId" defaultValue={params.departmentId || ""} className="mt-1 rounded-xl">
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Severity
                <Select name="severityId" defaultValue={params.severityId || ""} className="mt-1 rounded-xl">
                  <option value="">All severities</option>
                  {severities.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-medium text-muted-foreground">
                Status
                <Select name="status" defaultValue={params.status || ""} className="mt-1 rounded-xl">
                  <option value="">All statuses</option>
                  {EVENT_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-medium text-muted-foreground sm:col-span-2">
                Owner
                <Select name="ownerId" defaultValue={params.ownerId || ""} className="mt-1 rounded-xl">
                  <option value="">All owners</option>
                  {owners.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="mt-auto flex flex-col-reverse gap-2 pt-2 sm:col-span-2 sm:flex-row sm:justify-end">
                <Button type="button" variant="outline" className="h-12 min-h-12 rounded-xl sm:h-10" asChild>
                  <Link href={`/app/dashboard?range=${params.range || "monthly"}`}>Reset</Link>
                </Button>
                <Button type="submit" className="h-12 min-h-12 rounded-xl sm:h-10">
                  Apply filters
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
