import type { SupabaseClient } from "@supabase/supabase-js";
import { createCapa } from "@/lib/services/capa";
import { createActionItem } from "@/lib/services/supporting";
import { rejectSelfApprove } from "@/lib/ai/guardrails/forbidden";
import { auditAiEvent } from "@/lib/ai/audit";

export function suggestionNeedsApproval(status: string) {
  return status === "pending";
}

export function canActorApprove(input: { actorType: "human" | "agent"; permissionOk: boolean }) {
  if (!rejectSelfApprove({ actorType: input.actorType })) return false;
  return input.permissionOk;
}

export async function decideSuggestion(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    suggestionId: string;
    decision: "approved" | "rejected" | "edited";
    note?: string;
    editedPayload?: Record<string, unknown>;
    actorType: "human" | "agent";
    hasApprovePermission: boolean;
  },
) {
  if (!canActorApprove({ actorType: input.actorType, permissionOk: input.hasApprovePermission })) {
    throw new Error("AI cannot approve its own recommendation. A human with ai.approve must decide.");
  }

  const { data: row, error } = await supabase
    .from("ai_suggestions")
    .select("*")
    .eq("id", input.suggestionId)
    .eq("organization_id", input.organizationId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!row) throw new Error("Suggestion not found in this organization");
  if (row.status !== "pending") throw new Error("Suggestion already decided");

  if (input.decision === "rejected") {
    const { error: upd } = await supabase
      .from("ai_suggestions")
      .update({
        status: "rejected",
        decided_by: input.userId,
        decided_at: new Date().toISOString(),
        decision_note: input.note ?? null,
      })
      .eq("id", row.id)
      .eq("organization_id", input.organizationId);
    if (upd) throw new Error(upd.message);
    await auditAiEvent(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      action: "ai.suggestion.rejected",
      entityType: "ai_suggestion",
      entityId: row.id,
    });
    return { id: row.id, status: "rejected" as const };
  }

  const payload = {
    ...((row.payload ?? {}) as Record<string, unknown>),
    ...(input.editedPayload ?? {}),
  };
  let appliedId: string | null = null;
  let appliedTable: string | null = null;

  if (row.suggestion_type === "draft_capa") {
    const capa = await createCapa(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      sourceModule: (payload.sourceModule as "incident" | "other") ?? "other",
      sourceRecordId: String(payload.sourceRecordId ?? row.source_record_id ?? row.id),
      title: String(payload.title ?? row.title),
      description: String(payload.description ?? ""),
      priority: (payload.priority as "low" | "medium" | "high" | "critical") ?? "medium",
      dueDate: payload.dueDate ? String(payload.dueDate) : undefined,
    });
    await supabase.from("capa_items").update({ ai_generated: true }).eq("id", capa.id).eq("organization_id", input.organizationId);
    appliedId = capa.id;
    appliedTable = "capa_items";
  } else if (row.suggestion_type === "draft_action") {
    const action = await createActionItem(supabase, {
      organizationId: input.organizationId,
      userId: input.userId,
      title: String(payload.title ?? row.title),
      description: String(payload.description ?? ""),
      dueDate: payload.dueDate ? String(payload.dueDate) : undefined,
      priority: (payload.priority as "low" | "medium" | "high" | "critical") ?? "medium",
    });
    await supabase.from("action_items").update({ ai_generated: true }).eq("id", action.id).eq("organization_id", input.organizationId);
    appliedId = action.id;
    appliedTable = "action_items";
  } else if (row.suggestion_type === "draft_incident_summary" && (payload.incidentId || row.source_record_id)) {
    const eventId = String(payload.incidentId ?? row.source_record_id);
    const { data: comment, error: cErr } = await supabase
      .from("ehs_event_comments")
      .insert({
        organization_id: input.organizationId,
        event_id: eventId,
        body: `[AI draft — human approved]\n${String(payload.summary ?? payload.description ?? row.title)}`,
        author_id: input.userId,
      })
      .select("id")
      .single();
    if (cErr) throw new Error(cErr.message);
    appliedId = comment.id;
    appliedTable = "ehs_event_comments";
  }

  const status = input.decision === "edited" ? "edited" : "approved";
  const { error: upd } = await supabase
    .from("ai_suggestions")
    .update({
      status,
      payload,
      decided_by: input.userId,
      decided_at: new Date().toISOString(),
      decision_note: input.note ?? null,
      applied_record_id: appliedId,
      applied_table: appliedTable,
    })
    .eq("id", row.id)
    .eq("organization_id", input.organizationId);
  if (upd) throw new Error(upd.message);

  await auditAiEvent(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    action: `ai.suggestion.${status}`,
    entityType: "ai_suggestion",
    entityId: row.id,
    metadata: { appliedTable, appliedId },
  });

  return { id: row.id, status, appliedId, appliedTable };
}
