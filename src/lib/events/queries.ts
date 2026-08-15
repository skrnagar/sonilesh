import type { SupabaseClient } from "@supabase/supabase-js";

export async function listEventsByType(
  supabase: SupabaseClient,
  organizationId: string,
  typeCode: string,
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
    .order("occurred_at", { ascending: false });

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

  const [activity, comments, capas, investigation] = await Promise.all([
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
  ]);

  return {
    event,
    activity: activity.data ?? [],
    comments: comments.data ?? [],
    capas: capas.data ?? [],
    investigation: investigation.data ?? null,
  };
}
