import { describe, expect, it } from "vitest";
import { checkRequestedUsage, mergeEntitlements, overrideIsActive } from "@/lib/entitlements/resolve";
import { usageLimitMessage } from "@/lib/usage/live";

describe("entitlement merge", () => {
  it("adds override limit onto the plan limit", () => {
    const result = mergeEntitlements(
      [{ featureCode: "max_sites", enabled: true, limitValue: 5, unlimited: false }],
      [
        {
          featureCode: "max_sites",
          enabled: true,
          limitValue: 10,
          unlimited: false,
          startsAt: "2026-01-01T00:00:00.000Z",
          endsAt: null,
        },
      ],
    );
    expect(result[0].limitValue).toBe(15);
    expect(result[0].source).toBe("override");
  });

  it("enables a feature the plan disabled via override", () => {
    const result = mergeEntitlements(
      [{ featureCode: "ai_copilot", enabled: false, limitValue: null, unlimited: false }],
      [
        {
          featureCode: "ai_copilot",
          enabled: true,
          limitValue: null,
          unlimited: false,
          startsAt: "2026-01-01T00:00:00.000Z",
          endsAt: null,
        },
      ],
    );
    expect(result[0].enabled).toBe(true);
  });

  it("ignores expired temporary overrides", () => {
    expect(
      overrideIsActive(
        {
          featureCode: "ai_copilot",
          enabled: true,
          limitValue: null,
          unlimited: false,
          startsAt: "2026-09-01T00:00:00.000Z",
          endsAt: "2026-09-30T00:00:00.000Z",
        },
        "2026-10-01T00:00:00.000Z",
      ),
    ).toBe(false);
    const result = mergeEntitlements(
      [{ featureCode: "ai_copilot", enabled: false, limitValue: null, unlimited: false }],
      [
        {
          featureCode: "ai_copilot",
          enabled: true,
          limitValue: null,
          unlimited: false,
          startsAt: "2026-09-01T00:00:00.000Z",
          endsAt: "2026-09-30T00:00:00.000Z",
        },
      ],
      "2026-10-01T00:00:00.000Z",
    );
    expect(result[0].enabled).toBe(false);
    expect(result[0].source).toBe("plan");
  });
});

describe("usage limits", () => {
  it("blocks when current plus requested exceeds the cap", () => {
    const result = checkRequestedUsage({
      enabled: true,
      unlimited: false,
      limit: 500,
      current: 491,
      requested: 10,
    });
    expect(result.allowed).toBe(false);
    expect(usageLimitMessage("users")).toMatch(/User limit reached/);
  });

  it("allows remaining capacity for sites", () => {
    const result = checkRequestedUsage({
      enabled: true,
      unlimited: false,
      limit: 10,
      current: 3,
      requested: 2,
    });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(7);
  });
});
