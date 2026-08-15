"use server";

import { requireOrgContext } from "@/lib/auth/org-context";
import { createEhsEvent } from "@/lib/services/events";
import { transitionCapa } from "@/lib/services/capa";

export async function submitFieldReportAction(formData: FormData) {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const mode = String(formData.get("mode") || "incident");
    const intent = String(formData.get("intent") || "submit");
    const description = String(formData.get("description") || "").trim();
    if (!description) return { ok: false as const, error: "Description required" };

    const eventTypeCode =
      mode === "near-miss"
        ? "near_miss"
        : mode === "hazard"
          ? String(formData.get("category") || "hazard")
          : "incident";

    const gps = String(formData.get("gps") || formData.get("location_text") || "");
    const immediate = String(formData.get("immediate_action") || "");
    const people = String(formData.get("people") || "");

    const created = await createEhsEvent(supabase, {
      organizationId: organization.id,
      userId: user.id,
      eventTypeCode,
      description: [
        description,
        gps ? `GPS/Location: ${gps}` : null,
        people ? `People involved: ${people}` : null,
        formData.get("risk_level") ? `Risk level: ${formData.get("risk_level")}` : null,
      ]
        .filter(Boolean)
        .join("\n"),
      title: description.slice(0, 80),
      immediateAction: immediate || undefined,
      occurredAt: String(formData.get("occurred_at") || new Date().toISOString()),
      submit: intent === "submit",
    });

    const event = "event" in created ? created.event : created;
    return { ok: true as const, id: event.id };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}

export async function completeFieldCapaAction(formData: FormData) {
  try {
    const { supabase, user, organization } = await requireOrgContext();
    const capaId = String(formData.get("capaId") || "");
    const evidence = String(formData.get("evidence") || "");
    const comment = String(formData.get("comment") || "");
    if (!capaId) return { ok: false as const, error: "Missing CAPA" };

    await transitionCapa(supabase, {
      organizationId: organization.id,
      userId: user.id,
      capaId,
      toStatus: "pending_verification",
      evidence: [evidence, comment].filter(Boolean).join("\n"),
      notes: comment,
    });
    return { ok: true as const };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : "Failed" };
  }
}
