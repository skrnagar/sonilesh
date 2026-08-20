import { createAdminClient } from "@/lib/supabase/admin";
import { jsonError, jsonOk } from "@/lib/http/api-response";
import { billingWebhookEventId } from "@/lib/billing/webhook";

/**
 * Razorpay (or compatible) webhook: updates subscription status and plan.
 * Configure RAZORPAY_WEBHOOK_SECRET in the host environment.
 * Idempotent on (provider, provider_event_id).
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return jsonError("NOT_CONFIGURED", "Webhook not configured", 503, request);
  }

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  const { createHmac } = await import("node:crypto");
  const { timingSafeEqualHex } = await import("@/lib/api/public");
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (!timingSafeEqualHex(expected, signature)) {
    return jsonError("AUTH", "Invalid signature", 401, request);
  }

  let payload: {
    event?: string;
    payload?: {
      subscription?: { entity?: Record<string, unknown> };
      payment?: { entity?: Record<string, unknown> };
    };
  };
  try {
    payload = JSON.parse(raw) as typeof payload;
  } catch {
    return jsonError("VALIDATION", "Invalid JSON", 400, request);
  }

  const event = payload.event ?? "";
  const entity =
    payload.payload?.subscription?.entity ?? payload.payload?.payment?.entity ?? {};
  const organizationId = String(
    entity.notes && typeof entity.notes === "object"
      ? (entity.notes as { organization_id?: string }).organization_id ?? ""
      : "",
  );
  const planId = String((entity as { plan_id?: string }).plan_id ?? "");
  const statusRaw = String((entity as { status?: string }).status ?? "");
  const providerEventId = billingWebhookEventId(request, raw, payload as Record<string, unknown>);

  const admin = createAdminClient();
  const { data: inserted, error: idempotencyError } = await admin
    .from("billing_webhook_events")
    .insert({
      provider: "razorpay",
      provider_event_id: providerEventId,
      organization_id: organizationId || null,
      event_type: event || "webhook",
    })
    .select("id")
    .maybeSingle();

  const tableMissing =
    idempotencyError?.code === "42P01" ||
    idempotencyError?.code === "PGRST205" ||
    /billing_webhook_events|schema cache/i.test(idempotencyError?.message ?? "");

  if (idempotencyError?.code === "23505") {
    return jsonOk({ duplicate: true }, request);
  }
  if (idempotencyError && !tableMissing) {
    return jsonError("INTERNAL", "Could not record webhook event", 500, request);
  }
  if (!tableMissing && !inserted) {
    return jsonOk({ duplicate: true }, request);
  }

  if (!organizationId) {
    return jsonOk({ ignored: true }, request);
  }

  const status =
    event.includes("cancelled") || statusRaw === "cancelled"
      ? "cancelled"
      : event.includes("halted") || statusRaw === "past_due"
        ? "past_due"
        : "active";

  const { data: current } = await admin
    .from("subscriptions")
    .select("id")
    .eq("organization_id", organizationId)
    .is("deleted_at", null)
    .maybeSingle();

  if (current) {
    await admin
      .from("subscriptions")
      .update({
        status,
        ...(planId ? { plan_id: planId } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq("id", current.id);
  }

  await admin.from("subscription_events").insert({
    organization_id: organizationId,
    event_type: event || "webhook",
    payload: payload as unknown as Record<string, unknown>,
  });

  return jsonOk({ processed: true }, request);
}
