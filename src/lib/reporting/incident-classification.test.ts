import { describe, expect, it } from "vitest";

/** Mirrors field/app classification remap for incident → UA/UC. */
function resolveIncidentReportKind(
  eventTypeCode: string,
  reportKind: string,
): string {
  if (
    eventTypeCode === "incident" &&
    (reportKind === "unsafe_act" || reportKind === "unsafe_condition")
  ) {
    return reportKind;
  }
  return eventTypeCode;
}

describe("incident classification remap", () => {
  it("keeps incident when report kind is incident", () => {
    expect(resolveIncidentReportKind("incident", "incident")).toBe("incident");
    expect(resolveIncidentReportKind("incident", "")).toBe("incident");
  });

  it("maps Unsafe Act / Unsafe Condition from the incident form", () => {
    expect(resolveIncidentReportKind("incident", "unsafe_act")).toBe("unsafe_act");
    expect(resolveIncidentReportKind("incident", "unsafe_condition")).toBe(
      "unsafe_condition",
    );
  });

  it("does not remap non-incident types", () => {
    expect(resolveIncidentReportKind("near_miss", "unsafe_act")).toBe("near_miss");
  });
});
