import { describe, expect, it } from "vitest";
import { canTransitionCapa, isCapaOverdue } from "@/lib/services/capa";

describe("central CAPA engine", () => {
  it("supports verification rework path", () => {
    expect(canTransitionCapa("pending_verification", "in_progress")).toBe(true);
    expect(canTransitionCapa("pending_verification", "verified")).toBe(true);
  });

  it("treats overdue as derived state", () => {
    expect(isCapaOverdue("open", "2000-01-01")).toBe(true);
    expect(isCapaOverdue("closed", "2000-01-01")).toBe(false);
    expect(isCapaOverdue("open", null)).toBe(false);
  });

  it("does not allow verify from open (owner must complete first)", () => {
    expect(canTransitionCapa("open", "verified")).toBe(false);
    expect(canTransitionCapa("pending_verification", "verified")).toBe(true);
  });
});
