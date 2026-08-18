import { createHash } from "node:crypto";

export function billingWebhookEventId(
  request: Request,
  raw: string,
  payload: Record<string, unknown>,
) {
  const headerId = request.headers.get("x-razorpay-event-id")?.trim();
  if (headerId) return headerId.slice(0, 200);
  const event = typeof payload.event === "string" ? payload.event : "webhook";
  const nested = payload.payload as
    | { subscription?: { entity?: { id?: string } }; payment?: { entity?: { id?: string } } }
    | undefined;
  const entityId =
    nested?.subscription?.entity?.id || nested?.payment?.entity?.id || "";
  if (entityId) return `${event}:${entityId}`.slice(0, 200);
  return createHash("sha256").update(raw).digest("hex");
}
