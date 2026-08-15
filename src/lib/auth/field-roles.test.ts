import { describe, expect, it } from "vitest";
import { canFieldAction, fieldRoleFromCodes, greetingForNow } from "@/lib/auth/field-roles";

describe("field role gating", () => {
  it("maps contractor to limited actions", () => {
    const role = fieldRoleFromCodes(["contractor"]);
    expect(canFieldAction(role, "report_incident")).toBe(false);
    expect(canFieldAction(role, "my_permits")).toBe(true);
  });

  it("gives supervisors approve_permit", () => {
    expect(canFieldAction(fieldRoleFromCodes(["supervisor"]), "approve_permit")).toBe(true);
  });

  it("returns a greeting", () => {
    expect(greetingForNow(new Date("2026-08-13T09:00:00Z"))).toMatch(/GOOD /);
  });
});
