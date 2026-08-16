"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Option = { id: string; name: string };

export function ScopeFilters({
  params,
  sites,
  projects,
  departments,
  bus,
}: {
  params: {
    siteId?: string;
    projectId?: string;
    departmentId?: string;
    businessUnitId?: string;
  };
  sites: Option[];
  projects: Option[];
  departments: Option[];
  bus: Option[];
}) {
  const [open, setOpen] = useState(false);
  const activeCount = [
    params.siteId,
    params.projectId,
    params.departmentId,
    params.businessUnitId,
  ].filter(Boolean).length;

  return (
    <>
      <Button type="button" variant="outline" className="rounded-xl" onClick={() => setOpen(true)}>
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount ? (
          <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-[2px]">
          <div
            role="dialog"
            aria-labelledby="scope-filters-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-lg)]"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="scope-filters-title" className="font-display text-lg font-semibold">
                  Scope filters
                </h2>
                <p className="text-sm text-muted-foreground">
                  Limit KPIs by business unit, site, project, or department.
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
            <form className="mt-5 grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-medium text-muted-foreground">
                Business unit
                <Select name="businessUnitId" defaultValue={params.businessUnitId || ""} className="mt-1">
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
                <Select name="siteId" defaultValue={params.siteId || ""} className="mt-1">
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
                <Select name="projectId" defaultValue={params.projectId || ""} className="mt-1">
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
                <Select name="departmentId" defaultValue={params.departmentId || ""} className="mt-1">
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </label>
              <div className="flex gap-2 sm:col-span-2 sm:justify-end">
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
