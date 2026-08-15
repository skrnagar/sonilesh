import { describe, expect, it } from "vitest";
import {
  canTransitionRisk,
  resolveBand,
  scoreRisk,
  HIERARCHY_OF_CONTROLS,
} from "@/lib/services/risk";

const bands = [
  { code: "low", name: "Low", min_score: 1, max_score: 4 },
  { code: "medium", name: "Medium", min_score: 5, max_score: 9 },
  { code: "high", name: "High", min_score: 10, max_score: 14 },
  { code: "critical", name: "Critical", min_score: 15, max_score: 25 },
];

describe("risk matrix engine", () => {
  it("scores likelihood x consequence", () => {
    expect(scoreRisk(3, 4)).toBe(12);
  });

  it("resolves bands from config (not hard-coded)", () => {
    expect(resolveBand(3, bands)).toBe("low");
    expect(resolveBand(12, bands)).toBe("high");
    expect(resolveBand(25, bands)).toBe("critical");
  });

  it("supports org-custom bands", () => {
    const custom = [
      { code: "green", name: "Green", min_score: 1, max_score: 10 },
      { code: "red", name: "Red", min_score: 11, max_score: 25 },
    ];
    expect(resolveBand(10, custom)).toBe("green");
    expect(resolveBand(11, custom)).toBe("red");
  });

  it("enforces hierarchy of controls values", () => {
    expect(HIERARCHY_OF_CONTROLS).toContain("elimination");
    expect(HIERARCHY_OF_CONTROLS).toContain("ppe");
  });

  it("allows draft to in_progress", () => {
    expect(canTransitionRisk("draft", "in_progress")).toBe(true);
  });
});
