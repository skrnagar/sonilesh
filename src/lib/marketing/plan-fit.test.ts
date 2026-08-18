import { describe, expect, it } from "vitest";
import { recommendPlan } from "@/lib/marketing/plan-fit";

describe("which plan fits", () => {
  it("recommends Team for one site without ESG/compliance", () => {
    expect(
      recommendPlan({ sites: "one", esgCompliance: false, privateInstance: false }),
    ).toBe("Team");
  });

  it("recommends Business for multi-site or ESG/compliance on cloud", () => {
    expect(
      recommendPlan({ sites: "several", esgCompliance: false, privateInstance: false }),
    ).toBe("Business");
    expect(
      recommendPlan({ sites: "one", esgCompliance: true, privateInstance: false }),
    ).toBe("Business");
  });

  it("recommends Enterprise for private instance or complex portfolio", () => {
    expect(
      recommendPlan({ sites: "one", esgCompliance: false, privateInstance: true }),
    ).toBe("Enterprise");
    expect(
      recommendPlan({ sites: "portfolio", esgCompliance: true, privateInstance: false }),
    ).toBe("Enterprise");
  });
});
