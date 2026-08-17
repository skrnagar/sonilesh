import type { SupabaseClient } from "@supabase/supabase-js";
import { createCapa, type CapaSourceModule } from "@/lib/services/capa";
import { capaSourceModuleForType } from "@/lib/reporting/types";
import { writeAuditLog } from "@/lib/services/audit";

/**
 * CAPA integration contract — full CAPA engine exists; this is the report → CAPA bridge.
 * Future: source_module = EHS_REPORT / type-specific, source_record_id = report.id
 */
export async function createCAPAFromReport(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    reportId: string;
    title: string;
    description?: string;
    dueDate?: string;
    ownerId?: string;
    priority?: "low" | "medium" | "high" | "critical";
  },
) {
  const { data: event, error } = await supabase
    .from("ehs_events")
    .select("id, event_number, title, event_types:event_type_id(code)")
    .eq("id", input.reportId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!event) throw new Error("Report not found");

  const typeCode =
    (event.event_types as { code?: string } | null)?.code ?? "incident";
  const sourceModule = capaSourceModuleForType(typeCode) as CapaSourceModule;

  const capa = await createCapa(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    sourceModule,
    sourceRecordId: input.reportId,
    eventId: input.reportId,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    ownerId: input.ownerId,
    priority: input.priority,
    isRequired: true,
  });

  await supabase
    .from("ehs_events")
    .update({
      requires_capa: true,
      status: "capa",
      updated_by: input.userId,
    })
    .eq("id", input.reportId)
    .eq("organization_id", input.organizationId);

  await supabase.from("ehs_event_activity").insert({
    organization_id: input.organizationId,
    event_id: input.reportId,
    actor_user_id: input.userId,
    activity_type: "capa_created",
    message: `CAPA created from report ${event.event_number}`,
    metadata: { capa_id: capa.id, source_module: sourceModule },
  });

  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: "report.capa_requested",
    entityType: "ehs_event",
    entityId: input.reportId,
    newValues: { capa_id: capa.id, source_module: sourceModule },
  });

  return capa;
}

/** @deprecated Prefer createCAPAFromReport */
export async function createCapaForEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    eventId: string;
    title: string;
    description?: string;
    dueDate?: string;
    ownerId?: string;
    priority?: string;
  },
) {
  return createCAPAFromReport(supabase, {
    organizationId: input.organizationId,
    userId: input.userId,
    reportId: input.eventId,
    title: input.title,
    description: input.description,
    dueDate: input.dueDate,
    ownerId: input.ownerId,
    priority: (input.priority as "low" | "medium" | "high" | "critical") ?? "medium",
  });
}
