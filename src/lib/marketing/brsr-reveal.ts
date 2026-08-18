/**
 * Presentation labels for the marketing BRSR checker.
 * Does not change evaluateObligationRules / SAMPLE_OBLIGATIONS.
 */
export type BrsrRevealKind = "likely_mandatory" | "not_yet" | "voluntary";

export const BRSR_REVEAL_COPY: Record<BrsrRevealKind, string> = {
  likely_mandatory: "Likely mandatory",
  not_yet: "Not yet",
  voluntary: "Voluntary",
};

export function brsrRevealKind(applies: boolean, isListed: boolean): BrsrRevealKind {
  if (applies) return "likely_mandatory";
  if (isListed) return "not_yet";
  return "voluntary";
}

export function formatBrsrShareText(input: {
  label: string;
  reason: string;
  matches: string[];
}) {
  const other = input.matches.length ? `\nOther sample matches: ${input.matches.join("; ")}` : "";
  return `SONIL EHS360 BRSR checker (sample): ${input.label}\n${input.reason}${other}\nNot a legal opinion — same sample rules as the in-app engine.`;
}
