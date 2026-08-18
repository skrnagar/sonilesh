export { wrapUntrustedDocument, detectInjectionAttempt, sanitizeUserPrompt, systemPromptIntact } from "./injection";
export { isForbiddenToolName, softenClaims, rejectSelfApprove } from "./forbidden";
export { redactForModel, minimizeRows } from "./redaction";
export { checkRateLimit, resetRateLimitForTests } from "./rate-limit";

export function validateToolArgs(args: unknown) {
  if (args == null || typeof args !== "object" || Array.isArray(args)) {
    return { ok: false as const, error: "Tool arguments must be an object." };
  }
  const record = args as Record<string, unknown>;
  const blocked = ["organization_id", "organizationId", "user_id", "userId", "orgId"];
  const sanitized = { ...record };
  for (const key of blocked) delete sanitized[key];
  return { ok: true as const, args: sanitized };
}
