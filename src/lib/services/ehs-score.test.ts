import { describe, expect, it } from "vitest";
import {
  EHS_SCORE_MIN_DATA_POINTS,
  calculateEhsScore,
} from "@/lib/services/ehs-score";

function mockSupabase(responses: Record<string, unknown[]>) {
  const from = (table: string) => {
    const rows = responses[table] ?? [];
    const builder = {
      select: () => builder,
      eq: () => builder,
      gte: () => builder,
      is: () => builder,
      limit: () => builder,
      then: (resolve: (v: { data: unknown[] }) => void) => resolve({ data: rows }),
    };
    return builder;
  };
  return { from } as never;
}

describe("calculateEhsScore", () => {
  it("returns insufficient_data when zero records", async () => {
    const supabase = mockSupabase({});
    const result = await calculateEhsScore(supabase, "org-1");
    expect(result.status).toBe("insufficient_data");
    expect(result.overall).toBeNull();
    expect(result.isDemo).toBe(false);
    expect(result.dataCoverage.dataPoints).toBe(0);
    expect(result.dimensions.every((d) => d.score === null)).toBe(true);
  });

  it("returns insufficient_data below minimum threshold", async () => {
    const supabase = mockSupabase({
      ehs_events: [{ id: "1", status: "closed", event_types: { code: "incident" } }],
      capa_items: [{ id: "1", status: "open" }],
    });
    const result = await calculateEhsScore(supabase, "org-1");
    expect(result.status).toBe("insufficient_data");
    expect(result.dataCoverage.dataPoints).toBeLessThan(EHS_SCORE_MIN_DATA_POINTS);
  });

  it("returns calculated score when enough real data exists", async () => {
    const events = Array.from({ length: 3 }, (_, i) => ({
      id: `e${i}`,
      status: "closed",
      occurred_at: new Date().toISOString(),
      event_types: { code: i === 0 ? "incident" : "unsafe_act" },
    }));
    const capa = Array.from({ length: 2 }, (_, i) => ({ id: `c${i}`, status: "closed" }));
    const lmra = [{ id: "l1", status: "approved" }];
    const inspections = [{ id: "i1", status: "completed" }];
    const training = [{ id: "t1", status: "completed" }];

    const supabase = mockSupabase({
      ehs_events: events,
      capa_items: capa,
      lmra_assessments: lmra,
      checklist_assignments: inspections,
      training_assignments: training,
    });

    const result = await calculateEhsScore(supabase, "org-1");
    expect(result.status).toBe("calculated");
    expect(result.overall).not.toBeNull();
    expect(result.isDemo).toBe(false);
    expect(result.dimensions.some((d) => d.source === "calculated")).toBe(true);
  });
});
