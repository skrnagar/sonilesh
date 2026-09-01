import { describe, expect, it } from "vitest";
import { canFieldAction } from "@/lib/auth/field-roles";
import {
  FIELD_REPORT_LINKS,
  filterFieldReportLinks,
  getFieldReportLink,
  resolveAccessAtLevel,
} from "@/lib/field/report-links";

describe("field report links", () => {
  it("has unique keys and valid hrefs", () => {
    const keys = FIELD_REPORT_LINKS.map((l) => l.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const link of FIELD_REPORT_LINKS) {
      expect(link.href.startsWith("/field/")).toBe(true);
      expect(link.label.length).toBeGreaterThan(0);
    }
  });

  it("maps UA UCs to ualist", () => {
    const ua = getFieldReportLink("ua-ucs");
    expect(ua?.href).toBe("/field/ualist");
    expect(ua?.status).toBe("live");
  });

  it("scaffold links use reports sub-route", () => {
    const scaffold = FIELD_REPORT_LINKS.filter((l) => l.status === "scaffold");
    expect(scaffold.length).toBeGreaterThan(0);
    for (const link of scaffold) {
      expect(link.href.startsWith("/field/reports/")).toBe(true);
      expect(link.webHref?.startsWith("/app/")).toBe(true);
    }
  });

  it("filters links by role permissions", () => {
    const contractor = filterFieldReportLinks("contractor");
    const employee = filterFieldReportLinks("employee");
    expect(contractor.length).toBeLessThan(employee.length);
    expect(contractor.every((l) => canFieldAction("contractor", l.fieldAction))).toBe(true);
  });

  it("resolves access at from workspace scope", () => {
    expect(
      resolveAccessAtLevel({
        projectId: "p1",
        siteId: null,
        regionId: null,
        businessUnitId: null,
      }),
    ).toBe("Project");
    expect(
      resolveAccessAtLevel({
        projectId: null,
        siteId: null,
        regionId: "r1",
        businessUnitId: null,
      }),
    ).toBe("Region");
    expect(
      resolveAccessAtLevel({
        projectId: null,
        siteId: null,
        regionId: null,
        businessUnitId: null,
      }),
    ).toBe("Organization");
  });
});
