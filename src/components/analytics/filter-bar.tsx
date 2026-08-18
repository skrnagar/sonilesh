"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AnalyticsQuery } from "@/lib/analytics/types";

const RANGES = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "quarter", label: "Quarter" },
  { value: "fy", label: "FY" },
  { value: "last_7", label: "7d" },
  { value: "last_30", label: "30d" },
  { value: "last_90", label: "90d" },
  { value: "custom", label: "Custom" },
] as const;

type Option = { id: string; name: string };

export function AnalyticsFilterBar({
  action,
  query,
  sites,
  projects,
  departments,
  bus,
  range,
}: {
  action: string;
  query: AnalyticsQuery;
  sites: Option[];
  projects: Option[];
  departments?: Option[];
  bus?: Option[];
  range: string;
}) {
  return (
    <form method="get" action={action} className="flex min-w-0 flex-col gap-3 rounded-2xl border border-border bg-card p-3">
      <div className="flex flex-wrap gap-1.5">
        {RANGES.map((item) => (
          <Link
            key={item.value}
            href={`${action}?${nextParams(query, { range: item.value })}`}
            className={
              range === item.value
                ? "rounded-lg bg-primary px-2.5 py-1.5 text-xs font-semibold text-white dark:text-[#071f2d]"
                : "rounded-lg bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
            }
          >
            {item.label}
          </Link>
        ))}
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-medium text-muted-foreground">
          Site
          <Select name="siteId" defaultValue={query.siteId || ""} className="mt-1 rounded-xl">
            <option value="">Accessible sites</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          Project
          <Select name="projectId" defaultValue={query.projectId || ""} className="mt-1 rounded-xl">
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
        </label>
        {bus?.length ? (
          <label className="text-xs font-medium text-muted-foreground">
            Business unit
            <Select name="businessUnitId" defaultValue={query.businessUnitId || ""} className="mt-1 rounded-xl">
              <option value="">All business units</option>
              {bus.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        {departments?.length ? (
          <label className="text-xs font-medium text-muted-foreground">
            Department
            <Select name="departmentId" defaultValue={query.departmentId || ""} className="mt-1 rounded-xl">
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </label>
        ) : null}
        <label className="text-xs font-medium text-muted-foreground">
          From
          <Input type="date" name="dateFrom" defaultValue={query.dateFrom || ""} className="mt-1 rounded-xl" />
        </label>
        <label className="text-xs font-medium text-muted-foreground">
          To
          <Input type="date" name="dateTo" defaultValue={query.dateTo || ""} className="mt-1 rounded-xl" />
        </label>
        <input type="hidden" name="range" value={range} />
        <div className="flex items-end gap-2">
          <Button type="submit" className="h-10 rounded-xl">
            Apply
          </Button>
          <Button type="button" variant="outline" className="h-10 rounded-xl" asChild>
            <Link href={action}>Reset</Link>
          </Button>
        </div>
      </div>
    </form>
  );
}

function nextParams(query: AnalyticsQuery, patch: Record<string, string>) {
  const params = new URLSearchParams();
  const merged: AnalyticsQuery = { ...query, ...patch };
  if (patch.range && patch.range !== "custom") {
    delete merged.dateFrom;
    delete merged.dateTo;
  }
  for (const [key, value] of Object.entries(merged)) {
    if (value) params.set(key, value);
  }
  return params.toString();
}
