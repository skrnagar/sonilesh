import { describe, expect, it } from "vitest";
import {
  defaultEhsScoreBiFilters,
  ehsScoreBiPeriodLabel,
  loadEhsScoreBiDashboard,
} from "@/lib/services/ehs-score-bi";

describe("ehs-score-bi", () => {
  it("builds default filters from workspace", () => {
    const filters = defaultEhsScoreBiFilters({
      businessUnitId: "bu-1",
      regionId: "reg-1",
      projectId: "proj-1",
    });
    expect(filters.businessUnitId).toBe("bu-1");
    expect(filters.regionId).toBe("reg-1");
    expect(filters.projectId).toBe("proj-1");
    expect(filters.year).toBeGreaterThan(2020);
    expect(filters.month).toBeGreaterThanOrEqual(1);
    expect(filters.month).toBeLessThanOrEqual(12);
  });

  it("formats period label", () => {
    expect(ehsScoreBiPeriodLabel(2024, 1)).toBe("January 2024");
  });

  it("returns empty scope note when no projects match", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            limit: () => Promise.resolve({ data: [] }),
          }),
        }),
      }),
    } as never;

    const dashboard = await loadEhsScoreBiDashboard(supabase, "org-1", {
      filters: defaultEhsScoreBiFilters({}, { projectId: "missing" }),
      businessUnits: [],
      regions: [],
      sites: [],
      projects: [{ id: "p1", name: "Alpha", site_id: null, business_unit_id: null }],
    });

    expect(dashboard.assessmentRows).toHaveLength(0);
    expect(dashboard.dataNote).toMatch(/No projects match/);
  });
});
