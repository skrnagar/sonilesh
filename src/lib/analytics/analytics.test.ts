import { describe, expect, it } from "vitest";
import { percentChange } from "@/lib/dashboard/aggregates";
import { buildDrilldownHref } from "./drilldown";
import { computeHealthScore } from "./health-score";
import { resolveAnalyticsPeriod, zonedParts } from "./periods";
import {
  analyticsCacheKey,
  filterByAccessibleSites,
  isolateTenantRows,
  resolveAccessibleSiteIds,
} from "./scope";
import { summarizeDelta, summarizeNoEffectiveness } from "./summaries";
import { dedupeAlerts, defaultDashboardForRoles } from "./metrics";
import type { TenantScope } from "@/lib/tenancy/context";
import type { MetricValue } from "./types";

const sites = [
  { id: "site-a", name: "Plant A", business_unit_id: "bu-1" },
  { id: "site-b", name: "Plant B", business_unit_id: "bu-2" },
];

describe("analytics tenant isolation", () => {
  it("drops rows from another organization before aggregating", () => {
    const rows = [
      { organization_id: "org-1", n: 1 },
      { organization_id: "org-2", n: 99 },
      { organization_id: "org-1", n: 2 },
    ];
    const isolated = isolateTenantRows(rows, "org-1");
    expect(isolated.map((r) => r.n)).toEqual([1, 2]);
    expect(isolated.every((r) => r.organization_id === "org-1")).toBe(true);
  });

  it("uses tenant-aware cache keys so orgs never share a snapshot", () => {
    const a = analyticsCacheKey({
      organizationId: "org-a",
      userId: "user-1",
      range: "month",
      siteIds: null,
    });
    const b = analyticsCacheKey({
      organizationId: "org-b",
      userId: "user-1",
      range: "month",
      siteIds: null,
    });
    expect(a).not.toBe(b);
    expect(a.startsWith("analytics:org-a:")).toBe(true);
  });
});

describe("site-scope aggregates", () => {
  it("org-scoped roles see all listed sites until a site filter is chosen", () => {
    const scopes: TenantScope[] = [
      { scope: "organization", siteId: null, departmentId: null, businessUnitId: null, projectId: null },
    ];
    expect(resolveAccessibleSiteIds(scopes, sites, null)).toBeNull();
    expect(resolveAccessibleSiteIds(scopes, sites, "site-a")).toEqual(["site-a"]);
  });

  it("site-scoped roles never include inaccessible sites in the aggregate set", () => {
    const scopes: TenantScope[] = [
      { scope: "site", siteId: "site-a", departmentId: null, businessUnitId: null, projectId: null },
    ];
    expect(resolveAccessibleSiteIds(scopes, sites, null)).toEqual(["site-a"]);
    expect(resolveAccessibleSiteIds(scopes, sites, "site-b")).toEqual([]);

    const rows = [
      { id: "1", site_id: "site-a" },
      { id: "2", site_id: "site-b" },
    ];
    expect(filterByAccessibleSites(rows, ["site-a"]).map((r) => r.id)).toEqual(["1"]);
    expect(filterByAccessibleSites(rows, []).map((r) => r.id)).toEqual([]);
  });
});

describe("filter changes drill-down dataset", () => {
  it("carries the same range and site into module list URLs", () => {
    const href = buildDrilldownHref("/app/capa", {
      range: "month",
      siteId: "site-a",
      dateFrom: "2026-04-01",
      dateTo: "2026-04-30",
    });
    expect(href).toContain("/app/capa?");
    expect(href).toContain("siteId=site-a");
    expect(href).toContain("range=month");
    expect(href).toContain("dateFrom=2026-04-01");
    expect(href).toContain("dateTo=2026-04-30");
  });

  it("changing site produces a different drill-down query", () => {
    const a = buildDrilldownHref("/app/incidents", { range: "week", siteId: "site-a" });
    const b = buildDrilldownHref("/app/incidents", { range: "week", siteId: "site-b" });
    expect(a).not.toBe(b);
    expect(a).toContain("siteId=site-a");
    expect(b).toContain("siteId=site-b");
  });
});

describe("zero prior-period percent handling", () => {
  it("returns null when previous is zero and current is activity", () => {
    expect(percentChange(4, 0)).toBeNull();
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(12, 10)).toBe(20);
  });

  it("does not invent a percentage in the deterministic summary", () => {
    expect(summarizeDelta("Open CAPA", 5, 0)).toMatch(/no prior-period baseline/i);
    expect(summarizeDelta("Open CAPA", 12, 10)).toBe(
      "Open CAPA increased 20% vs prior period (12 vs 10).",
    );
    expect(summarizeNoEffectiveness()).toBe("No effectiveness data available.");
  });
});

describe("organization timezone periods", () => {
  it("starts the Indian FY on 1 April in Asia/Kolkata, not UTC midnight mixed into March", () => {
    const period = resolveAnalyticsPeriod({
      query: { range: "fy" },
      timeZone: "Asia/Kolkata",
      fiscalYearStartMonth: 4,
      now: new Date("2026-08-18T02:00:00.000Z"),
    });
    const startParts = zonedParts(period.start, "Asia/Kolkata");
    expect(startParts.year).toBe(2026);
    expect(startParts.month).toBe(4);
    expect(startParts.day).toBe(1);
    expect(startParts.hour).toBe(0);
    expect(period.start.toISOString()).toBe("2026-03-31T18:30:00.000Z");
  });
});

describe("alerts and health score", () => {
  it("dedupes by source_type, source_id, alert_type", () => {
    const alerts = dedupeAlerts([
      {
        sourceType: "capa",
        sourceId: "c1",
        alertType: "overdue_capa",
        severity: "critical",
        title: "A",
        href: "/app/capa",
        siteId: null,
      },
      {
        sourceType: "capa",
        sourceId: "c1",
        alertType: "overdue_capa",
        severity: "critical",
        title: "A again",
        href: "/app/capa",
        siteId: null,
      },
    ]);
    expect(alerts).toHaveLength(1);
  });

  it("omits missing components instead of inventing a black-box 100", () => {
    const metrics: MetricValue[] = [
      {
        code: "overdue_capa",
        label: "Overdue CAPA",
        value: 0,
        display: "0",
        hint: "On time",
        tone: "good",
        href: "/app/capa",
        trend: null,
        polarity: "higher-is-worse",
        classification: "lagging",
        previous: null,
      },
    ];
    const health = computeHealthScore(metrics);
    expect(health.incomplete).toBe(true);
    expect(health.score).toBe(100);
    expect(health.explanation[0]).toMatch(/optional composite/i);
    expect(health.components.filter((c) => c.included)).toHaveLength(1);
  });
});

describe("role dashboards", () => {
  it("maps existing roles and does not invent new ones", () => {
    expect(defaultDashboardForRoles(["ehs_manager"])).toBe("executive_control_tower");
    expect(defaultDashboardForRoles(["ehs_officer"])).toBe("site_operations");
    expect(defaultDashboardForRoles(["auditor"])).toBe("assurance");
    expect(defaultDashboardForRoles(["employee"])).toBe("field_queue");
    expect(defaultDashboardForRoles(["compliance_officer"])).toBe("assurance");
  });
});
