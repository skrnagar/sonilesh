import { describe, expect, it } from "vitest";
import { computeScore } from "@/lib/services/checklists";

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
});
