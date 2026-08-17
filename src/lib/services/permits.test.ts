import { describe, expect, it } from "vitest";
import {
  canTransitionPermit,
  evaluateChecklistGate,
  isExpiringSoon,
  isPermitExpired,
  normalizePermitStatus,
  permitCountdown,
  permitValidityDisplay,
  validateLinkedRisk,
} from "@/lib/services/permits";

describe("permit engine", () => {
  it("follows request to active workflow", () => {
    expect(canTransitionPermit("requested", "risk_review")).toBe(true);
    expect(canTransitionPermit("approval_required", "active")).toBe(true);
    expect(canTransitionPermit("active", "closed")).toBe(false);
    expect(canTransitionPermit("active", "closeout")).toBe(true);
  });

  it("normalizes legacy statuses", () => {
    expect(normalizePermitStatus("risk_check")).toBe("risk_review");
    expect(normalizePermitStatus("authorization")).toBe("approval_required");
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

  it("blocks activation semantics for expired validity display", () => {
    const past = new Date(Date.now() - 60_000).toISOString();
    expect(permitValidityDisplay("active", null, past)).toBe("Expired");
  });

  it("supports suspend / resume / extension loop", () => {
    expect(canTransitionPermit("active", "suspended")).toBe(true);
    expect(canTransitionPermit("suspended", "active")).toBe(true);
    expect(canTransitionPermit("active", "extension_pending")).toBe(true);
    expect(canTransitionPermit("extension_pending", "active")).toBe(true);
  });

  it("blocks transitions from terminal statuses", () => {
    expect(canTransitionPermit("closed", "active")).toBe(false);
    expect(canTransitionPermit("cancelled", "requested")).toBe(false);
    expect(canTransitionPermit("rejected", "active")).toBe(false);
  });

  it("evaluates checklist gate — remaining required", () => {
    const gate = evaluateChecklistGate([
      { is_required: true, is_checked: false },
      { is_required: true, response_value: "yes" },
      { is_required: false, is_checked: false },
    ]);
    expect(gate.remaining).toBe(1);
    expect(gate.ok).toBe(false);
    expect(gate.message).toContain("1 required check");
  });

  it("evaluates checklist gate — blocking failure", () => {
    const gate = evaluateChecklistGate([
      {
        is_required: true,
        response_value: "no",
        failure_blocks_approval: true,
        failure_requires_comment: true,
        comment: "",
      },
    ]);
    expect(gate.blocking).toBe(1);
    expect(gate.ok).toBe(false);
  });

  it("passes checklist when complete", () => {
    const gate = evaluateChecklistGate([
      { is_required: true, response_value: "yes" },
      { is_required: true, response_value: "pass" },
    ]);
    expect(gate.ok).toBe(true);
  });
});

describe("validateLinkedRisk (mock client)", () => {
  it("rejects cross-tenant risk assessment", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          in: async () => ({
            data: [
              {
                id: "ra-1",
                organization_id: "other-org",
                status: "active",
                site_id: null,
                project_id: null,
                assessment_number: "RA-1",
                deleted_at: null,
              },
            ],
            error: null,
          }),
        }),
      }),
    } as never;

    await expect(
      validateLinkedRisk(supabase, {
        organizationId: "org-1",
        riskAssessmentId: "ra-1",
      }),
    ).rejects.toThrow(/another organization/i);
  });

  it("rejects retired risk assessment", async () => {
    const supabase = {
      from: () => ({
        select: () => ({
          in: async () => ({
            data: [
              {
                id: "ra-1",
                organization_id: "org-1",
                status: "retired",
                site_id: null,
                project_id: null,
                assessment_number: "RA-1",
                deleted_at: null,
              },
            ],
            error: null,
          }),
        }),
      }),
    } as never;

    await expect(
      validateLinkedRisk(supabase, {
        organizationId: "org-1",
        riskAssessmentId: "ra-1",
      }),
    ).rejects.toThrow(/retired/i);
  });

  it("requires risk when configured", async () => {
    const supabase = { from: () => ({}) } as never;
    await expect(
      validateLinkedRisk(supabase, {
        organizationId: "org-1",
        requireRisk: true,
      }),
    ).rejects.toThrow(/required/i);
  });
});
