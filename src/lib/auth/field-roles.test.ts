import { describe, expect, it } from "vitest";
import { canFieldAction, fieldRoleFromCodes, greetingForNow } from "@/lib/auth/field-roles";
import {
  filterRakshaLaunchpadForField,
  RAKSHA_LAUNCHPAD_TILES,
} from "@/lib/navigation/raksha-launchpad";

describe("field role gating", () => {
  it("maps contractor to limited actions", () => {
    const role = fieldRoleFromCodes(["contractor"]);
    expect(canFieldAction(role, "report_incident")).toBe(false);
    expect(canFieldAction(role, "my_permits")).toBe(true);
    expect(canFieldAction(role, "my_zone")).toBe(true);
    expect(canFieldAction(role, "bbs")).toBe(true);
  });

  it("gives supervisors approve_permit and checklist access", () => {
    const role = fieldRoleFromCodes(["supervisor"]);
    expect(canFieldAction(role, "approve_permit")).toBe(true);
    expect(canFieldAction(role, "inspection")).toBe(true);
    expect(canFieldAction(role, "new_checklist")).toBe(true);
    expect(canFieldAction(role, "checklist_template")).toBe(false);
  });

  it("gives employees site_visit access", () => {
    expect(canFieldAction(fieldRoleFromCodes(["employee"]), "site_visit")).toBe(true);
  });

  it("gives ehs staff MIS and scorecard access", () => {
    const role = fieldRoleFromCodes(["ehs_officer"]);
    expect(canFieldAction(role, "ehs_mis")).toBe(true);
    expect(canFieldAction(role, "ehs_score")).toBe(true);
    expect(canFieldAction(role, "nc")).toBe(true);
  });

  it("returns a greeting", () => {
    expect(greetingForNow(new Date("2026-08-13T09:00:00Z"))).toMatch(/GOOD /);
  });
});

describe("RAKSHA launchpad", () => {
  it("defines all 17 modules", () => {
    expect(RAKSHA_LAUNCHPAD_TILES).toHaveLength(17);
  });

  it("filters tiles for employee role", () => {
    const tiles = filterRakshaLaunchpadForField("employee");
    expect(tiles.some((t) => t.key === "my-zone")).toBe(true);
    expect(tiles.some((t) => t.key === "utilities")).toBe(false);
    expect(tiles.some((t) => t.key === "incident")).toBe(true);
  });
});
