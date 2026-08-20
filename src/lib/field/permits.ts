import type { SupabaseClient } from "@supabase/supabase-js";

export function isFieldPermitParty(
  permit: {
    requester_id?: string | null;
    issuer_id?: string | null;
    work_leader_id?: string | null;
  },
  userId: string,
) {
  return (
    permit.requester_id === userId ||
    permit.issuer_id === userId ||
    permit.work_leader_id === userId
  );
}

/** PostgREST `.or()` filter: my permits, plus pending approvals for approvers. */
export function fieldPermitsOrFilter(userId: string, canApprove: boolean, extraIds: string[] = []) {
  const clauses = [
    `requester_id.eq.${userId}`,
    `issuer_id.eq.${userId}`,
    `work_leader_id.eq.${userId}`,
  ];
  if (canApprove) {
    clauses.push("status.eq.approval_required", "status.eq.authorization");
  }
  const ids = extraIds.filter((id) => /^[0-9a-f-]{36}$/i.test(id));
  if (ids.length) {
    clauses.push(`id.in.(${ids.join(",")})`);
  }
  return clauses.join(",");
}

export async function userCanAccessFieldPermit(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    permitId: string;
    userId: string;
    canApprove: boolean;
  },
) {
  const { data: permit } = await supabase
    .from("permits")
    .select("id, requester_id, issuer_id, work_leader_id, status")
    .eq("id", input.permitId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (!permit) return { ok: false as const, permit: null };
  if (input.canApprove || isFieldPermitParty(permit, input.userId)) {
    return { ok: true as const, permit };
  }
  const { data: worker } = await supabase
    .from("permit_workers")
    .select("id")
    .eq("permit_id", permit.id)
    .eq("organization_id", input.organizationId)
    .eq("user_id", input.userId)
    .maybeSingle();
  if (worker) return { ok: true as const, permit };
  return { ok: false as const, permit };
}
