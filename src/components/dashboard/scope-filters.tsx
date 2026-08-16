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
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(true)}>
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
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[8vh] backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-labelledby="scope-filters-title"
            className="w-full max-w-2xl rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-lg)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="scope-filters-title" className="font-display text-lg font-semibold">
                  Dashboard filters
                </h2>
                <p className="text-sm text-muted-foreground">
                  Tenant-scoped views by date, site, project, department, severity, status, owner, and business unit.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border hover:bg-muted"
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
              <div className="flex flex-wrap gap-2 sm:col-span-2 sm:justify-end">
                <Button type="button" variant="outline" className="rounded-xl" asChild>
                  <Link href={`/app/dashboard?range=${params.range || "monthly"}`}>Reset</Link>
                </Button>
                <Button type="submit" className="rounded-xl">
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
