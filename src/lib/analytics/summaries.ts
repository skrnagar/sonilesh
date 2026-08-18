import { percentChange } from "@/lib/dashboard/aggregates";

export function formatPercentChange(current: number, previous: number): number | null {
  return percentChange(current, previous);
}

/** Deterministic, non-generative summary. */
export function summarizeDelta(
  label: string,
  current: number,
  previous: number,
  options?: { unit?: string },
) {
  const unit = options?.unit ?? "";
  const suffix = unit ? ` ${unit}` : "";
  const pct = percentChange(current, previous);
  if (pct === null) {
    return `${label} is ${current}${suffix} in the selected period (no prior-period baseline).`;
  }
  if (pct === 0) {
    return `${label} unchanged vs prior period (${current}${suffix}).`;
  }
  const dir = pct > 0 ? "increased" : "decreased";
  return `${label} ${dir} ${Math.abs(pct)}% vs prior period (${current} vs ${previous}${suffix}).`;
}

export function summarizeMissingRate(label: string) {
  return `${label}: counts shown only — workforce hours are missing, so a rate was not calculated.`;
}

export function summarizeNoEffectiveness() {
  return "No effectiveness data available.";
}
