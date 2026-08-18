import type { AICitation } from "@/lib/ai/core/types";

export function dedupeCitations(rows: AICitation[]) {
  const seen = new Set<string>();
  const out: AICitation[] = [];
  for (const row of rows) {
    const key = `${row.sourceType}:${row.sourceId ?? row.title}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(row);
  }
  return out;
}

export function citationConfidence(rows: AICitation[]) {
  if (!rows.length) return null;
  const values = rows.map((r) => r.confidence ?? 0.3);
  return Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 1000) / 1000;
}

export function insufficientEvidenceText() {
  return "I do not have enough evidence in this organization’s records to answer that. No citation is available.";
}
