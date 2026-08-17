import { describe, expect, it } from "vitest";
import {
  isFieldOnlyRoles,
  landingPathForSession,
} from "@/lib/auth/personas";

describe("persona routing", () => {
  it("sends employees only to field home", () => {
    expect(isFieldOnlyRoles(["employee"])).toBe(true);
    expect(
      landingPathForSession({
        portal: "company",
        isPlatformAdmin: false,
        roleCodes: ["employee"],
      }),
    ).toBe("/field/home");
  });

  it("sends officers to the reporting queue", () => {
    expect(
      landingPathForSession({
        portal: "company",
        isPlatformAdmin: false,
        roleCodes: ["ehs_officer"],
      }),
    ).toBe("/app/reporting/queue");
  });

  it("sends company secretaries to the compliance dashboard", () => {
    expect(
      landingPathForSession({
        portal: "company",
        isPlatformAdmin: false,
        roleCodes: ["company_secretary"],
      }),
    ).toBe("/app/compliance/dashboard");
  });

  it("rejects non-platform admins at the admin portal", () => {
    expect(
      landingPathForSession({
        portal: "admin",
        isPlatformAdmin: false,
        roleCodes: ["ehs_manager"],
      }),
    ).toBeNull();
  });
});
