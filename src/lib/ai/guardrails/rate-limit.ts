import { AI_RATE_LIMIT } from "@/lib/ai/core/config";

type Bucket = { windowStart: number; requests: number; tokens: number };
const memory = new Map<string, Bucket>();

function hourStart(now = Date.now()) {
  return now - (now % 3_600_000);
}

export function checkRateLimit(input: {
  organizationId: string;
  userId: string;
  tokens?: number;
  now?: number;
}) {
  const start = hourStart(input.now);
  const key = `${input.organizationId}:${input.userId}:${start}`;
  const bucket = memory.get(key) ?? { windowStart: start, requests: 0, tokens: 0 };
  const nextRequests = bucket.requests + 1;
  const nextTokens = bucket.tokens + (input.tokens ?? 0);
  if (nextRequests > AI_RATE_LIMIT.requestsPerHour) {
    return { allowed: false as const, reason: "AI request rate limit reached. Try again later." };
  }
  if (nextTokens > AI_RATE_LIMIT.tokensPerHour) {
    return { allowed: false as const, reason: "AI token budget for this hour is exhausted." };
  }
  memory.set(key, { windowStart: start, requests: nextRequests, tokens: nextTokens });
  return { allowed: true as const, remaining: AI_RATE_LIMIT.requestsPerHour - nextRequests };
}

export function resetRateLimitForTests() {
  memory.clear();
}
