import { describe, expect, it } from "vitest";
import {
  bucketByPeriod,
  capaAging,
  inspectionCompletion,
  percentChange,
  periodBounds,
  riskHeat,
} from "./aggregates";

describe("dashboard aggregates", () => {
  it("computes previous period of equal length", () => {
    const now = new Date("2026-08-16T12:00:00.000Z");
    const { start, end, prevStart, prevEnd } = periodBounds("weekly", now);
    expect(end.getTime() - start.getTime()).toBe(prevEnd.getTime() - prevStart.getTime());
  });

  it("returns null percent change from a zero baseline with activity", () => {
    expect(percentChange(4, 0)).toBeNull();
    expect(percentChange(0, 0)).toBe(0);
    expect(percentChange(12, 10)).toBe(20);
  });

  it("buckets timestamps into daily series", () => {
    const start = new Date("2026-08-10T00:00:00.000Z");
    const end = new Date("2026-08-12T23:59:59.000Z");
    const series = bucketByPeriod(
      ["2026-08-10T08:00:00.000Z", "2026-08-10T18:00:00.000Z", "2026-08-12T01:00:00.000Z"],
      "weekly",
      start,
      end,
    );
    expect(series.map((p) => p.value)).toEqual([2, 0, 1]);
  });

  it("ages open CAPA by due date", () => {
    const today = new Date("2026-08-16T00:00:00.000Z");
    const buckets = capaAging(
      [
        { due_date: "2026-08-20", status: "open" },
        { due_date: "2026-08-12", status: "in_progress" },
        { due_date: "2026-07-01", status: "open" },
        { due_date: "2026-07-01", status: "closed" },
      ],
      today,
    );
    expect(buckets[0].value).toBe(1);
    expect(buckets[1].value).toBe(1);
    expect(buckets[4].value).toBe(1);
  });

  it("computes inspection completion without cancelled rows", () => {
    const result = inspectionCompletion([
      { status: "completed" },
      { status: "scheduled" },
      { status: "cancelled" },
    ]);
    expect(result).toEqual({ total: 2, completed: 1, percent: 50 });
  });

  it("builds a 5x5 residual risk heat", () => {
    const cells = riskHeat([
      { residual_likelihood: 5, residual_consequence: 5 },
      { residual_likelihood: 5, residual_consequence: 5 },
      { residual_likelihood: 1, residual_consequence: 1 },
    ]);
    expect(cells.find((c) => c.l === 5 && c.c === 5)?.count).toBe(2);
    expect(cells.find((c) => c.l === 1 && c.c === 1)?.count).toBe(1);
  });
});
