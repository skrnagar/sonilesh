import type { SupabaseClient } from "@supabase/supabase-js";

export type AllocatedActionKind = "action_item" | "capa";

export type AllocatedActionRow = {
  id: string;
  kind: AllocatedActionKind;
  actionItem: string;
  actionType: string;
  allocatedBy: string;
  incidentRef: string;
  allocatedOn: string;
  expectedDueDate: string | null;
  status: string;
  statusLabel: "Open" | "Closed";
  canUpdate: boolean;
};

type ProfileRef = { full_name?: string | null } | null;
type EventRef = { event_number?: string | null } | null;

function formatActionType(moduleOrType: string | null | undefined, capaType?: string | null) {
  if (capaType) {
    return capaType === "preventive" ? "Preventive action" : "Corrective action";
  }
  if (!moduleOrType) return "Action item";
  return moduleOrType.replaceAll("_", " ");
}

function statusLabel(status: string): "Open" | "Closed" {
  if (["completed", "verified", "closed", "cancelled"].includes(status)) return "Closed";
  return "Open";
}

function canUpdateStatus(status: string) {
  return ["open", "in_progress", "pending_verification"].includes(status);
}

export async function getFieldAllocatedActions(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<AllocatedActionRow[]> {
  const [{ data: actions, error: actionError }, { data: capas, error: capaError }] =
    await Promise.all([
      supabase
        .from("action_items")
        .select(
          "id, title, status, due_date, created_at, source_module, source_record_id, created_by, profiles:created_by(full_name)",
        )
        .eq("organization_id", organizationId)
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
      supabase
        .from("capa_items")
        .select(
          "id, title, capa_type, status, due_date, created_at, created_by, event_id, profiles:created_by(full_name), ehs_events:event_id(event_number)",
        )
        .eq("organization_id", organizationId)
        .eq("owner_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false }),
    ]);

  if (actionError) throw new Error(actionError.message);
  if (capaError) throw new Error(capaError.message);

  const sourceIds = (actions ?? [])
    .map((row) => row.source_record_id)
    .filter((id): id is string => Boolean(id));
  const { data: sourceEvents } =
    sourceIds.length > 0
      ? await supabase
          .from("ehs_events")
          .select("id, event_number")
          .eq("organization_id", organizationId)
          .in("id", sourceIds)
      : { data: [] as { id: string; event_number: string }[] };

  const eventNumberById = new Map(
    (sourceEvents ?? []).map((event) => [event.id, event.event_number]),
  );

  const actionRows: AllocatedActionRow[] = (actions ?? []).map((row) => {
    const creator = row.profiles as ProfileRef;
    const incidentRef =
      row.source_record_id
        ? eventNumberById.get(row.source_record_id) ??
          row.source_record_id.slice(0, 8).toUpperCase()
        : "—";
    return {
      id: row.id,
      kind: "action_item",
      actionItem: row.title,
      actionType: formatActionType(row.source_module),
      allocatedBy: creator?.full_name?.trim() || "—",
      incidentRef,
      allocatedOn: row.created_at,
      expectedDueDate: row.due_date,
      status: row.status,
      statusLabel: statusLabel(row.status),
      canUpdate: canUpdateStatus(row.status),
    };
  });

  const capaRows: AllocatedActionRow[] = (capas ?? []).map((row) => {
    const creator = row.profiles as ProfileRef;
    const event = row.ehs_events as EventRef;
    return {
      id: row.id,
      kind: "capa",
      actionItem: row.title,
      actionType: formatActionType(null, row.capa_type),
      allocatedBy: creator?.full_name?.trim() || "—",
      incidentRef: event?.event_number ?? "—",
      allocatedOn: row.created_at,
      expectedDueDate: row.due_date,
      status: row.status,
      statusLabel: statusLabel(row.status),
      canUpdate: canUpdateStatus(row.status),
    };
  });

  return [...actionRows, ...capaRows].sort(
    (a, b) => new Date(b.allocatedOn).getTime() - new Date(a.allocatedOn).getTime(),
  );
}

export function formatFieldActionDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
