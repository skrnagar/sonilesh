import { describe, expect, it } from "vitest";
import {
  canTransitionPermit,
  isExpiringSoon,
  isPermitExpired,
  permitCountdown,
} from "@/lib/services/permits";

describe("permit engine", () => {
  it("follows request to active workflow", () => {
    expect(canTransitionPermit("requested", "risk_check")).toBe(true);
    expect(canTransitionPermit("authorization", "active")).toBe(true);
    expect(canTransitionPermit("active", "closed")).toBe(false);
  });

  it("detects expired permits", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(isPermitExpired("active", past)).toBe(true);
    expect(isPermitExpired("closed", past)).toBe(false);
  });

  it("computes countdown and expiring soon", () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const c = permitCountdown(soon);
    expect(c?.expired).toBe(false);
    expect(isExpiringSoon(soon, 4)).toBe(true);
  });
});
