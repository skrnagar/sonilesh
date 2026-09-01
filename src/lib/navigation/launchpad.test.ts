import { describe, expect, it } from "vitest";
import {
  filterLaunchpadTiles,
  LAUNCHPAD_TILES,
  resolvePersonaLabel,
  selectDashboardTiles,
} from "@/lib/navigation/launchpad";

const ALL_FEATURES = [
  "hazard_reporting",
  "incident_management",
  "near_miss",
  "permit_to_work",
  "risk_assessment",
  "inspections",
  "audits",
  "capa",
  "training",
  "contractor_management",
  "advanced_reports",
  "advanced_analytics",
  "executive_analytics",
  "ai_copilot",
  "enterprise_search",
];

const OFFICER_PERMISSIONS = [
  "dashboard.view",
  "hazards.view",
  "incidents.view",
  "near_miss.view",
  "lmra.view",
  "visits.view",
  "incidents.create",
  "permits.view",
  "risk.view",
  "inspections.view",
  "audits.view",
  "findings.view",
  "capa.view",
  "reports.view",
  "mis.view",
  "score.view",
  "analytics.view",
  "ai.use",
  "search.use",
];

describe("launchpad module catalog", () => {
  it("exposes 20+ operational modules", () => {
    const ops = LAUNCHPAD_TILES.filter((t) => t.section === "operations");
    expect(ops.length).toBeGreaterThanOrEqual(20);
  });

  it("filters tiles by feature and permission", () => {
    const visible = filterLaunchpadTiles(LAUNCHPAD_TILES, ALL_FEATURES, OFFICER_PERMISSIONS);
    expect(visible.some((t) => t.key === "ua-uc")).toBe(true);
    expect(visible.some((t) => t.key === "incidents")).toBe(true);
    expect(visible.some((t) => t.key === "ai-copilot")).toBe(true);
  });

  it("hides gated modules without entitlement", () => {
    const visible = filterLaunchpadTiles(LAUNCHPAD_TILES, [], OFFICER_PERMISSIONS);
    expect(visible.some((t) => t.key === "incidents")).toBe(false);
    expect(visible.some((t) => t.key === "dashboard")).toBe(true);
  });

  it("resolves persona labels from role codes", () => {
    expect(resolvePersonaLabel(["ehs_officer"])).toBe("Safety Officer");
    expect(resolvePersonaLabel(["ehs_admin"])).toBe("Corporate EHS");
    expect(resolvePersonaLabel(["employee"])).toBe("Worker");
    expect(resolvePersonaLabel(["auditor"])).toBe("Auditor");
  });

  it("prioritizes dashboard tiles for safety officers", () => {
    const visible = filterLaunchpadTiles(LAUNCHPAD_TILES, ALL_FEATURES, OFFICER_PERMISSIONS);
    const dashboard = selectDashboardTiles(visible, ["ehs_officer"]);
    expect(dashboard.some((t) => t.key === "reporting-queue")).toBe(true);
  });
});
