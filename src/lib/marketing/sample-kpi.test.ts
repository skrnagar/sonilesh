import { describe, expect, it } from "vitest";
import {
  assertCleanKpiDisplay,
  formatSampleKpi,
  isCleanKpiDisplay,
} from "@/lib/marketing/sample-kpi";

describe("sample KPI display guard", () => {
  it("formats a clean Open incidents placeholder", () => {
    expect(formatSampleKpi(12)).toBe("12");
    expect(assertCleanKpiDisplay("12")).toBe("12");
    expect(isCleanKpiDisplay("4")).toBe(true);
    expect(isCleanKpiDisplay("27")).toBe(true);
  });

  it("rejects the 12↔13 concatenation bug", () => {
    expect(isCleanKpiDisplay("12121312")).toBe(false);
    expect(isCleanKpiDisplay("1213")).toBe(false);
    expect(isCleanKpiDisplay("121312")).toBe(false);
    expect(() => assertCleanKpiDisplay("12121312")).toThrow(/Garbled/);
  });

  it("rejects non-integers and out-of-range values", () => {
    expect(() => formatSampleKpi(12.5)).toThrow(/Garbled/);
    expect(() => formatSampleKpi(-1)).toThrow(/Garbled/);
    expect(() => formatSampleKpi(1000)).toThrow(/Garbled/);
    expect(isCleanKpiDisplay("12,13")).toBe(false);
    expect(isCleanKpiDisplay("")).toBe(false);
  });
});
