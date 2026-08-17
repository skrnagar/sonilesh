import { describe, expect, it } from "vitest";
import {
  REPORT_TYPE_CODES,
  REPORT_TYPE_META,
  capaSourceModuleForType,
  requiredFieldsForType,
} from "@/lib/reporting/types";

describe("REPORT_TYPE_CODES", () => {
  it("defines exactly six report types", () => {
    expect(REPORT_TYPE_CODES).toHaveLength(6);
    expect(REPORT_TYPE_CODES).toEqual([
      "incident",
      "near_miss",
      "hazard",
      "unsafe_act",
      "unsafe_condition",
      "safety_observation",
    ]);
  });
});

describe("requiredFieldsForType", () => {
  it("requires severity for incidents", () => {
    expect(requiredFieldsForType("incident")).toEqual([
      "occurredAt",
      "siteId",
      "description",
      "severityId",
    ]);
  });

  it("requires potential severity for near misses", () => {
    expect(requiredFieldsForType("near_miss")).toEqual([
      "occurredAt",
      "siteId",
      "description",
      "potentialSeverityId",
    ]);
  });

  it("requires category for hazards", () => {
    expect(requiredFieldsForType("hazard")).toEqual([
      "siteId",
      "description",
      "categoryId",
    ]);
  });

  it("requires observation polarity for safety observations", () => {
    expect(requiredFieldsForType("safety_observation")).toEqual([
      "siteId",
      "description",
      "observationPolarity",
    ]);
  });
});

describe("capaSourceModuleForType", () => {
  it("maps each report type to its CAPA source module", () => {
    expect(capaSourceModuleForType("incident")).toBe("incident");
    expect(capaSourceModuleForType("near_miss")).toBe("near_miss");
    expect(capaSourceModuleForType("hazard")).toBe("hazard");
    expect(capaSourceModuleForType("unsafe_act")).toBe("unsafe_act");
    expect(capaSourceModuleForType("unsafe_condition")).toBe("unsafe_condition");
    expect(capaSourceModuleForType("safety_observation")).toBe("safety_observation");
  });

  it("falls back to ehs_report for unknown types", () => {
    expect(capaSourceModuleForType("unknown")).toBe("ehs_report");
    expect(capaSourceModuleForType("")).toBe("ehs_report");
  });
});

describe("REPORT_TYPE_META prefixes", () => {
  it("assigns unique number prefixes per type", () => {
    expect(REPORT_TYPE_META.incident.prefix).toBe("INC-");
    expect(REPORT_TYPE_META.near_miss.prefix).toBe("NM-");
    expect(REPORT_TYPE_META.hazard.prefix).toBe("HZ-");
    expect(REPORT_TYPE_META.unsafe_act.prefix).toBe("UA-");
    expect(REPORT_TYPE_META.unsafe_condition.prefix).toBe("UC-");
    expect(REPORT_TYPE_META.safety_observation.prefix).toBe("SO-");
  });

  it("covers every report type code", () => {
    for (const code of REPORT_TYPE_CODES) {
      expect(REPORT_TYPE_META[code]).toBeDefined();
      expect(REPORT_TYPE_META[code].prefix).toMatch(/^[A-Z]{2,3}-$/);
    }
  });
});
