import { describe, expect, it } from "vitest";
import {
  canTransitionChecklist,
  computeScore,
} from "@/lib/services/checklists";

describe("checklist scoring", () => {
  it("ignores NA responses in scoring", () => {
    const pct = computeScore(
      [
        { score: 1, is_na: false },
        { score: 0, is_na: true },
        { score: 1, is_na: false },
      ],
      2,
    );
    expect(pct).toBe(100);
  });

  it("returns partial score", () => {
    expect(
      computeScore(
        [
          { score: 1, is_na: false },
          { score: 0, is_na: false },
        ],
        2,
      ),
    ).toBe(50);
  });

  it("returns null when total weight is zero", () => {
    expect(computeScore([{ score: 1, is_na: false }], 0)).toBeNull();
  });
});

describe("checklist transitions", () => {
  it("allows inspection scheduled to in_progress", () => {
    expect(canTransitionChecklist("inspection", "scheduled", "in_progress")).toBe(true);
  });

  it("allows audit planned to in_progress", () => {
    expect(canTransitionChecklist("audit", "planned", "in_progress")).toBe(true);
  });

  it("blocks closed reactivation", () => {
    expect(canTransitionChecklist("inspection", "closed", "in_progress")).toBe(false);
    expect(canTransitionChecklist("audit", "closed", "planned")).toBe(false);
  });

  it("supports findings review to CAPA", () => {
    expect(canTransitionChecklist("inspection", "findings_review", "capa")).toBe(true);
    expect(canTransitionChecklist("compliance", "findings_review", "capa")).toBe(true);
  });
});
