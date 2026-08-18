import { FORBIDDEN_AUTONOMOUS_ACTIONS } from "@/lib/ai/core/types";

const LANGUAGE_GUARDS = [
  { re: /\bpredicted incidents?\b/i, replace: "potential risk signal" },
  { re: /\bwill have an incident\b/i, replace: "shows a potential risk signal" },
  { re: /\bconfirmed root cause\b/i, replace: "potential root cause" },
  { re: /\blegal (advice|opinion)\b/i, replace: "operational observation (not legal advice)" },
];

export function isForbiddenToolName(name: string) {
  return (FORBIDDEN_AUTONOMOUS_ACTIONS as readonly string[]).includes(name);
}

export function softenClaims(text: string) {
  let next = text;
  for (const row of LANGUAGE_GUARDS) {
    next = next.replace(row.re, row.replace);
  }
  return next;
}

export function rejectSelfApprove(input: { actorType: "human" | "agent"; toolName?: string }) {
  if (input.actorType === "agent") return false;
  if (input.toolName === "approve_suggestion") return false;
  return true;
}
