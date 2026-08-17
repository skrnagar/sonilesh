import { describe, expect, it } from "vitest";
import { assertPpeSiteScope } from "@/lib/services/ppe";
import { canTransitionMoc, validateMocLinkedRisk } from "@/lib/services/moc";
import { fieldChemicalPath } from "@/lib/services/chemicals";
import { isExpired, isExpiringWithin, resolveExpiryWarningDays } from "@/lib/services/expiry";

describe("PPE site scope", () => {
  it("allows org-wide issuers", () => {
    expect(() =>
      assertPpeSiteScope({ organizationWide: true, siteIds: [] }, "site-1", "site-1"),
    ).not.toThrow();
  });

  it("blocks issuing an item from another site", () => {
    expect(() =>
      assertPpeSiteScope({ organizationWide: false, siteIds: ["site-a"] }, "site-b", "site-a"),
    ).toThrow(/outside your site scope/i);
  });

  it("blocks issuing to an unscoped site", () => {
    expect(() =>
      assertPpeSiteScope({ organizationWide: false, siteIds: ["site-a"] }, "site-a", "site-b"),
    ).toThrow(/outside your site scope/i);
  });
});

describe("MOC engine", () => {
  it("follows requested to closed lifecycle", () => {
    expect(canTransitionMoc("requested", "risk_review")).toBe(true);
    expect(canTransitionMoc("approval", "implementation")).toBe(true);
    expect(canTransitionMoc("closed", "requested")).toBe(false);
  });

  it("rejects a risk assessment from another organization", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                id: "ra-1",
                organization_id: "other-org",
                status: "active",
                site_id: null,
                assessment_number: "RA-1",
                deleted_at: null,
              },
              error: null,
            }),
          }),
        }),
      }),
    } as never;

    await expect(
      validateMocLinkedRisk(supabase, { organizationId: "org-1", riskAssessmentId: "ra-1" }),
    ).rejects.toThrow(/another organization/i);
  });
});

describe("SDS field link", () => {
  it("uses an authenticated deep link, not a public SDS URL", () => {
    const path = fieldChemicalPath("chem-1");
    expect(path).toBe("/field/chemicals/chem-1");
    expect(path.startsWith("/field/")).toBe(true);
  });
});

describe("expiry thresholds", () => {
  it("reads configurable warning days instead of hard-coding 30", () => {
    expect(resolveExpiryWarningDays({ expiry_warning_days: 14 })).toBe(14);
    expect(resolveExpiryWarningDays({ settings: { expiry_warning_days: 7 } })).toBe(7);
    expect(resolveExpiryWarningDays(null)).toBe(30);
  });

  it("classifies expired vs expiring using the configured window", () => {
    const now = new Date("2026-08-17T00:00:00Z");
    expect(isExpired("2026-08-01", now)).toBe(true);
    expect(isExpiringWithin("2026-08-20", 14, now)).toBe(true);
    expect(isExpiringWithin("2026-12-01", 14, now)).toBe(false);
  });
});
