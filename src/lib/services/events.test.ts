import { describe, expect, it } from "vitest";
import { REPORT_TYPE_META } from "@/lib/reporting/types";
import { canTransition } from "@/lib/services/events";

describe("report type feature and permission maps", () => {
  it("derives feature keys from REPORT_TYPE_META", () => {
    const featureByType = Object.fromEntries(
      Object.entries(REPORT_TYPE_META).map(([code, meta]) => [code, meta.featureCode]),
    );
    expect(featureByType.incident).toBe("incident_management");
    expect(featureByType.near_miss).toBe("near_miss");
    expect(featureByType.hazard).toBe("hazard_reporting");
    expect(featureByType.unsafe_act).toBe("hazard_reporting");
    expect(featureByType.unsafe_condition).toBe("hazard_reporting");
    expect(featureByType.safety_observation).toBe("hazard_reporting");
  });

  it("derives create permissions from REPORT_TYPE_META", () => {
    const permissionCreate = Object.fromEntries(
      Object.entries(REPORT_TYPE_META).map(([code, meta]) => [code, meta.permissionCreate]),
    );
    expect(permissionCreate.incident).toBe("incidents.create");
    expect(permissionCreate.near_miss).toBe("near_miss.create");
    expect(permissionCreate.hazard).toBe("hazards.create");
    expect(permissionCreate.safety_observation).toBe("hazards.create");
  });
});

describe("EHS event workflow transitions", () => {
  it("allows draft to submitted", () => {
    expect(canTransition("draft", "submitted")).toBe(true);
  });

  it("blocks closed to triage", () => {
    expect(canTransition("closed", "triage")).toBe(false);
  });

  it("allows closed to reopened", () => {
    expect(canTransition("closed", "reopened")).toBe(true);
  });

  it("allows approval to closed", () => {
    expect(canTransition("approval", "closed")).toBe(true);
  });
});
