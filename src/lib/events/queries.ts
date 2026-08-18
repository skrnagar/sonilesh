import type { SupabaseClient } from "@supabase/supabase-js";

/** Server-side page size — never dump unbounded event lists into the browser. */
export const EVENT_LIST_PAGE_SIZE = 50;

export async function listEventsByType(
  supabase: SupabaseClient,
  organizationId: string,
  typeCode: string,
  opts?: { limit?: number },
) {
  const { data: eventType } = await supabase
    .from("event_types")
    .select("id")
    .eq("code", typeCode)
    .is("organization_id", null)
    .maybeSingle();

  if (!eventType) return [];

  const { data, error } = await supabase
    .from("ehs_events")
    .select(
      `
      id, event_number, title, status, occurred_at, description,
      sites:site_id(name),
      severity_levels:severity_id(name)
    `,
    )
    .eq("organization_id", organizationId)
    .eq("event_type_id", eventType.id)
    .is("deleted_at", null)
    .order("occurred_at", { ascending: false })
    .limit(opts?.limit ?? EVENT_LIST_PAGE_SIZE);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getEventBundle(
  supabase: SupabaseClient,
  organizationId: string,
  eventId: string,
) {
  const { data: event, error } = await supabase
    .from("ehs_events")
    .select(
      `
      *,
      event_types:event_type_id(code, name, feature_code),
      sites:site_id(name),
      severity_levels:severity_id(name, rank)
    `,
    )
    .eq("organization_id", organizationId)
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!event) return null;

  const [activity, comments, capas, investigation, attachmentsRaw] = await Promise.all([
    supabase
      .from("ehs_event_activity")
      .select("*")
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
    supabase
      .from("ehs_event_comments")
      .select("*")
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("capa_items")
      .select("*")
      .eq("event_id", eventId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("investigations")
      .select("*")
      .eq("event_id", eventId)
      .maybeSingle(),
    supabase
      .from("ehs_event_attachments")
      .select("id, file_name, mime_type, file_size, storage_path, kind, created_at")
      .eq("organization_id", organizationId)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false }),
  ]);

  const { createSignedAttachmentUrl } = await import("@/lib/services/attachments");
  const attachments = await Promise.all(
    (attachmentsRaw.data ?? []).map(async (row) => {
      let url: string | null = null;
      try {
        url = await createSignedAttachmentUrl(supabase, row.storage_path);
      } catch {
        url = null;
      }
      const mime = row.mime_type || "";
      return {
        id: row.id,
        file_name: row.file_name,
        content_type: row.mime_type as string | null,
        file_size: row.file_size as number | null,
        storage_path: row.storage_path as string,
        kind: (row.kind === "photo" || mime.startsWith("image/")
          ? "photo"
          : "document") as "photo" | "document",
        created_at: row.created_at as string | undefined,
        url,
      };
    }),
  );

  return {
    event,
    activity: activity.data ?? [],
    comments: comments.data ?? [],
    capas: capas.data ?? [],
    investigation: investigation.data ?? null,
    attachments,
  };
}
