import { describe, expect, it } from "vitest";
import {
  canTransitionRisk,
  resolveBand,
  scoreRisk,
  HIERARCHY_OF_CONTROLS,
  RISK_TRANSITIONS,
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

  it("returns null when score falls outside all bands", () => {
    expect(resolveBand(0, bands)).toBeNull();
    expect(resolveBand(100, bands)).toBeNull();
  });

  it("enforces hierarchy of controls values", () => {
    expect(HIERARCHY_OF_CONTROLS).toEqual([
      "elimination",
      "substitution",
      "engineering",
      "administrative",
      "ppe",
    ]);
  });

  it("allows draft to in_progress", () => {
    expect(canTransitionRisk("draft", "in_progress")).toBe(true);
  });

  it("requires approval before active", () => {
    expect(canTransitionRisk("review", "active")).toBe(false);
    expect(canTransitionRisk("approval", "active")).toBe(true);
  });

  it("supports periodic review loop", () => {
    expect(canTransitionRisk("active", "periodic_review")).toBe(true);
    expect(canTransitionRisk("periodic_review", "active")).toBe(true);
    expect(canTransitionRisk("periodic_review", "retired")).toBe(true);
  });

  it("blocks transitions from terminal statuses", () => {
    expect(canTransitionRisk("retired", "active")).toBe(false);
    expect(canTransitionRisk("cancelled", "draft")).toBe(false);
    expect(RISK_TRANSITIONS.retired).toEqual([]);
  });
});
