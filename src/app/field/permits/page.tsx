import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction } from "@/lib/auth/field-roles";
import { permitCountdown } from "@/lib/services/permits";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import {
  acknowledgeFieldPermitAction,
  approveFieldPermitAction,
} from "@/app/actions/field";
import { FieldSubmitForm } from "@/components/field/field-submit-form";
import {
  FieldCard,
  FieldEmpty,
  FieldPageHeader,
  fieldControlClass,
} from "@/components/field/field-ui";

export default async function FieldPermitsPage() {
  const { supabase, user, organization, membershipId } = await requireOrgContext();
  const role = await resolveFieldRole(supabase, membershipId);
  const canApprove = canFieldAction(role, "approve_permit");

  const { data: permits, error } = await supabase
    .from("permits")
    .select("id, permit_number, title, status, valid_to, requester_id, issuer_id")
    .eq("organization_id", organization.id)
    .or(`requester_id.eq.${user.id},issuer_id.eq.${user.id},status.eq.authorization,status.eq.active`)
    .is("deleted_at", null)
    .order("valid_to", { ascending: true })
    .limit(20);

  const { data: acks } = await supabase
    .from("permit_approvals")
    .select("permit_id")
    .eq("organization_id", organization.id)
    .eq("approver_id", user.id)
    .eq("approver_role", "field_ack");

  const acked = new Set((acks ?? []).map((a) => a.permit_id));

  return (
    <div className="space-y-4">
      <FieldPageHeader title="My permits" subtitle="View, acknowledge, or approve when authorized." />
      {error ? <FieldEmpty text={error.message} /> : null}
      {(permits ?? []).map((p) => {
        const c = permitCountdown(p.valid_to);
        return (
          <FieldCard key={p.id} className="space-y-3">
            <div>
              <p className="font-medium text-foreground">
                {p.permit_number} · {p.title}
              </p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {p.status}
                {c ? (c.expired ? " · EXPIRED" : ` · ${c.hours}h ${c.minutes}m left`) : ""}
              </p>
            </div>
            {p.status === "authorization" && canApprove ? (
              <FieldSubmitForm action={approveFieldPermitAction} submitLabel="Approve">
                <input type="hidden" name="permitId" value={p.id} />
                <input name="signature" placeholder="Signature name" required className={fieldControlClass} />
              </FieldSubmitForm>
            ) : null}
            {p.status === "active" && !acked.has(p.id) ? (
              <FieldSubmitForm action={acknowledgeFieldPermitAction} submitLabel="Acknowledge">
                <input type="hidden" name="permitId" value={p.id} />
                <input name="signature" placeholder="Signature name" required className={fieldControlClass} />
              </FieldSubmitForm>
            ) : null}
            {p.status === "active" && acked.has(p.id) ? (
              <p className="text-xs font-medium text-[var(--success-ink)]">Acknowledged</p>
            ) : null}
          </FieldCard>
        );
      })}
      {!permits?.length && !error ? <FieldEmpty text="No permits assigned." /> : null}
    </div>
  );
}
