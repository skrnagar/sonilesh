import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Razorpay (or compatible) webhook: updates subscription status and plan.
 * Configure RAZORPAY_WEBHOOK_SECRET in the host environment.
 */
export async function POST(request: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature") || "";

  const { createHmac } = await import("node:crypto");
  const expected = createHmac("sha256", secret).update(raw).digest("hex");
  if (expected !== signature) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
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
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = payload.event ?? "";
  const entity =
    payload.payload?.subscription?.entity ?? payload.payload?.payment?.entity ?? {};
  const organizationId = String(entity.notes && typeof entity.notes === "object"
    ? (entity.notes as { organization_id?: string }).organization_id ?? ""
    : "");
  const planId = String((entity as { plan_id?: string }).plan_id ?? "");
  const statusRaw = String((entity as { status?: string }).status ?? "");

  if (!organizationId) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const admin = createAdminClient();
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

  return NextResponse.json({ ok: true });
}
