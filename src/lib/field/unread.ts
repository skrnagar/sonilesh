import type { SupabaseClient } from "@supabase/supabase-js";

/** Head-count only — avoids importing the notifications/audit service graph. */
export async function countFieldUnread(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
): Promise<number> {
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", organizationId)
    .eq("user_id", userId)
    .is("read_at", null);

  if (error) return 0;
  return count ?? 0;
}
