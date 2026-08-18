import { describe, expect, it } from "vitest";
import { SAMPLE_RISK_COUNTS, sampleRiskBand } from "@/lib/marketing/sample-board";

describe("sample 5x5 risk heatmap", () => {
  it("is likelihood × consequence with product Default 5x5 bands", () => {
    expect(SAMPLE_RISK_COUNTS).toHaveLength(5);
    expect(SAMPLE_RISK_COUNTS.every((row) => row.length === 5)).toBe(true);
    expect(sampleRiskBand(1 * 1)).toBe("low");
    expect(sampleRiskBand(3 * 3)).toBe("medium");
    expect(sampleRiskBand(4 * 3)).toBe("high");
    expect(sampleRiskBand(5 * 5)).toBe("critical");
  });
});
