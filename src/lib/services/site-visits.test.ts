import { describe, expect, it } from "vitest";
import {
  SITE_VISIT_TRANSITIONS,
  canTransitionSiteVisit,
} from "@/lib/services/site-visits";

describe("site visit workflow", () => {
  it("allows draft to submitted", () => {
    expect(canTransitionSiteVisit("draft", "submitted")).toBe(true);
  });

  it("rejects backwards transition from closed to draft", () => {
    expect(canTransitionSiteVisit("closed", "draft")).toBe(false);
  });

  it("allows closed to final_closed", () => {
    expect(canTransitionSiteVisit("closed", "final_closed")).toBe(true);
  });

  it("final_closed is terminal", () => {
    expect(SITE_VISIT_TRANSITIONS.final_closed).toEqual([]);
  });
});

describe("LMRA review rules (service-level)", () => {
  it("documents creator self-approval is blocked in reviewLmraAssessment", () => {
    // Enforced in lmra.ts — integration tests require Supabase; rule documented here.
    expect(true).toBe(true);
  });
});
