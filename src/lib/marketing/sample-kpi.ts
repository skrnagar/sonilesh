/**
 * Guards marketing mock KPIs so Design Elevation tick/roll tricks cannot
 * concatenate into a fake live statistic (the "12121312" Open incidents bug).
 */

export const SAMPLE_KPI_PATTERN = /^\d{1,3}$/;

function failKpi(value: unknown): never {
  throw new Error(`Garbled sample KPI display: ${JSON.stringify(value)}`);
}

/** Integer 0–999 as a short decimal string. Rejects concat / NaN / floats. */
export function formatSampleKpi(value: number): string {
  if (!Number.isInteger(value) || value < 0 || value > 999) {
    if (process.env.NODE_ENV !== "production") failKpi(value);
    return "—";
  }
  const out = String(value);
  if (process.env.NODE_ENV !== "production") return assertCleanKpiDisplay(out);
  return SAMPLE_KPI_PATTERN.test(out) ? out : "—";
}

/** Runtime / test guard: a painted KPI must be a short integer, never "12121312". */
export function assertCleanKpiDisplay(text: string): string {
  if (typeof text !== "string" || !SAMPLE_KPI_PATTERN.test(text)) {
    failKpi(text);
  }
  if (text.includes("1213") || text.includes("1312")) {
    failKpi(text);
  }
  return text;
}

export function isCleanKpiDisplay(text: string): boolean {
  try {
    assertCleanKpiDisplay(text);
    return true;
  } catch {
    return false;
  }
}
