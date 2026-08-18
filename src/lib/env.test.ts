import { describe, expect, it } from "vitest";
import { assertRequiredServerEnv } from "@/lib/env";
import { UpgradeRequiredError } from "@/lib/services/entitlements";

describe("production env gate", () => {
  it("does not require AI or billing keys", () => {
    const result = assertRequiredServerEnv({ strict: false });
    expect(result.missing).not.toContain("OPENAI_API_KEY");
    expect(result.missing).not.toContain("RAZORPAY_KEY_SECRET");
    expect(result.missing).not.toContain("STRIPE_SECRET_KEY");
  });
});

describe("entitlement backend enforcement", () => {
  it("throws UpgradeRequiredError from the server entitlement helper", () => {
    const err = new UpgradeRequiredError("incident_management");
    expect(err.name).toBe("UpgradeRequiredError");
    expect(err.featureCode).toBe("incident_management");
  });
});
