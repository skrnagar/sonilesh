import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { OUTBOUND_WEBHOOK_EVENTS, type OutboundWebhookEvent } from "@/lib/integrations/types";

export const WEBHOOK_REPLAY_WINDOW_SECONDS = 300;

export function generateWebhookSecret() {
  return randomBytes(32).toString("hex");
}

export function signWebhookPayload(input: { secret: string; timestamp: number; body: string }) {
  const payload = `${input.timestamp}.${input.body}`;
  const digest = createHmac("sha256", input.secret).update(payload).digest("hex");
  return `t=${input.timestamp},v1=${digest}`;
}

export function parseSignatureHeader(header: string | null) {
  if (!header) return null;
  const parts = Object.fromEntries(
    header.split(",").map((part) => {
      const [k, v] = part.split("=");
      return [k?.trim(), v?.trim()] as const;
    }),
  );
  const timestamp = Number(parts.t);
  const v1 = parts.v1;
  if (!Number.isFinite(timestamp) || !v1) return null;
  return { timestamp, v1 };
}

export function verifyWebhookSignature(input: {
  secret: string;
  header: string | null;
  body: string;
  now?: number;
  replayWindowSeconds?: number;
}) {
  const parsed = parseSignatureHeader(input.header);
  if (!parsed) return { ok: false as const, reason: "missing_or_malformed_signature" };

  const now = input.now ?? Math.floor(Date.now() / 1000);
  const window = input.replayWindowSeconds ?? WEBHOOK_REPLAY_WINDOW_SECONDS;
  if (Math.abs(now - parsed.timestamp) > window) {
    return { ok: false as const, reason: "replay_window_exceeded" };
  }

  const expected = signWebhookPayload({
    secret: input.secret,
    timestamp: parsed.timestamp,
    body: input.body,
  });
  const expectedV1 = expected.split("v1=")[1] ?? "";
  const a = Buffer.from(expectedV1, "utf8");
  const b = Buffer.from(parsed.v1, "utf8");
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false as const, reason: "invalid_signature" };
  }
  return { ok: true as const };
}

export function isOutboundEvent(value: string): value is OutboundWebhookEvent {
  return (OUTBOUND_WEBHOOK_EVENTS as readonly string[]).includes(value);
}

export function deliveryIdempotencyKey(input: {
  eventType: string;
  entityId: string;
  occurrenceId?: string;
}) {
  return `${input.eventType}:${input.entityId}:${input.occurrenceId ?? "1"}`;
}

export function nextRetryAt(attemptCount: number, from = Date.now()) {
  const minutes = Math.min(60, 2 ** Math.max(0, attemptCount));
  return new Date(from + minutes * 60_000).toISOString();
}

export function shouldRetry(attemptCount: number, maxAttempts = 5) {
  return attemptCount < maxAttempts;
}
