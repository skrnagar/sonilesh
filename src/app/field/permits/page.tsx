import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction, fieldRoleFromCodes } from "@/lib/auth/field-roles";
import { permitCountdown } from "@/lib/services/permits";
import { transitionPermit } from "@/lib/services/permits";

async function approvePermitAction(formData: FormData) {
  "use server";
  const { supabase, user, organization } = await requireOrgContext();
  const permitId = String(formData.get("permitId") || "");
  await transitionPermit(supabase, {
    organizationId: organization.id,
    userId: user.id,
    permitId,
    toStatus: "active",
    signatureName: String(formData.get("signature") || user.email),
  });
}

export default async function FieldPermitsPage() {
  const { supabase, user, organization } = await requireOrgContext();
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("user_id", user.id)
    .eq("organization_id", organization.id)
    .maybeSingle();
  const { data: memberRoles } = membership
    ? await supabase
        .from("member_roles")
        .select("roles:role_id(code)")
        .eq("member_id", membership.id)
        .is("deleted_at", null)
    : { data: [] };
  const role = fieldRoleFromCodes(
    (memberRoles ?? [])
      .map((m) => (m.roles as { code?: string } | null)?.code)
      .filter(Boolean) as string[],
  );

  const { data: permits } = await supabase
    .from("permits")
    .select("id, permit_number, title, status, valid_to")
    .eq("organization_id", organization.id)
    .or(`requester_id.eq.${user.id},issuer_id.eq.${user.id},status.eq.authorization`)
    .is("deleted_at", null)
    .order("valid_to", { ascending: true })
    .limit(20);

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold">My permits</h1>
      {(permits ?? []).map((p) => {
        const c = permitCountdown(p.valid_to);
        return (
          <div key={p.id} className="rounded-xl border border-white/10 bg-slate-900/70 p-3">
            <p className="font-medium">
              {p.permit_number} · {p.title}
            </p>
            <p className="mt-1 text-xs capitalize text-slate-400">
              {p.status}
              {c
                ? c.expired
                  ? " · EXPIRED"
                  : ` · ${c.hours}h ${c.minutes}m left`
                : ""}
            </p>
            {p.status === "authorization" && canFieldAction(role, "approve_permit") ? (
              <form action={approvePermitAction} className="mt-3 space-y-2">
                <input type="hidden" name="permitId" value={p.id} />
                <input
                  name="signature"
                  placeholder="Signature name"
                  required
                  className="w-full rounded-lg border border-white/15 bg-slate-950 px-3 py-3 text-sm"
                />
                <button className="w-full rounded-xl bg-teal-500 py-3 text-sm font-bold text-slate-950">
                  Approve
                </button>
              </form>
            ) : null}
          </div>
        );
      })}
      {!permits?.length ? <p className="text-sm text-slate-500">No permits assigned.</p> : null}
    </div>
  );
}
