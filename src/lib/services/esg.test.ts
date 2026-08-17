import { describe, expect, it } from "vitest";
import { formatBrsrDocument } from "@/lib/services/esg";

describe("BRSR export", () => {
  it("emits Section A/B/C headings rather than a flat dump", () => {
    const doc = formatBrsrDocument({
      organizationName: "Acme Manufacturing",
      financialYear: "2025-26",
      sectionA: { name: "Acme Manufacturing", listed: true },
      sectionB: { P1: { has_policy: "yes", disclosure: "Code of conduct" } },
      sectionC: { employee_health_safety_incidents: 4, employee_health_safety_source: "ehs_events" },
    });
    expect(doc).toMatch(/SECTION A/);
    expect(doc).toMatch(/SECTION B/);
    expect(doc).toMatch(/SECTION C/);
    expect(doc).toMatch(/ehs_events/);
    expect(doc.toLowerCase()).not.toMatch(/complete for sebi/);
    expect(doc.toLowerCase()).toMatch(/not a claim of completeness/);
  });
});
