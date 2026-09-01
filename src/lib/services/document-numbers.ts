import type { SupabaseClient } from "@supabase/supabase-js";

/** Atomic org-scoped document numbers via `next_event_number` (PostgreSQL sequence table). */
export async function nextDocumentNumber(
  supabase: SupabaseClient,
  organizationId: string,
  sequenceKey: string,
  prefix: string,
): Promise<string> {
  const { data, error } = await supabase.rpc("next_event_number", {
    p_organization_id: organizationId,
    p_sequence_key: sequenceKey,
    p_prefix: prefix,
  });
  if (error || !data) {
    throw new Error(error?.message ?? `Failed to allocate document number for ${sequenceKey}`);
  }
  return String(data);
}

export const DOCUMENT_NUMBER_KEYS = {
  lmra: (orgId: string) => ({ key: `lmra:${orgId}`, prefix: "LMRA-" }),
  siteVisit: (orgId: string, type: string) => ({
    key: `site_visit_${type}:${orgId}`,
    prefix: `${type.toUpperCase()}-`,
  }),
  mis: (orgId: string) => ({ key: `mis:${orgId}`, prefix: "MIS-" }),
} as const;
