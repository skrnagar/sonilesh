import Link from "next/link";
import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction } from "@/lib/auth/field-roles";
import { permitCountdown } from "@/lib/field/permit-countdown";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import {
  acknowledgeFieldPermitAction,
  approveFieldPermitAction,
  requestFieldPermitRenewalAction,
} from "@/app/actions/field";
import { FieldSubmitForm } from "@/components/field/field-submit-form";
import {
  FieldCard,
  FieldEmpty,
  FieldForbidden,
  FieldPageHeader,
  fieldControlClass,
} from "@/components/field/field-ui";
import { hasFeature } from "@/lib/services/entitlements";

export default async function FieldPermitsPage() {
  const { supabase, user, organization, membershipId } = await requireOrgContext();

  const [entitled, role, permitsRes, acksRes] = await Promise.all([
    hasFeature(supabase, organization.id, "permit_to_work"),
    resolveFieldRole(supabase, membershipId),
    supabase
      .from("permits")
      .select(
        "id, permit_number, title, status, valid_to, requester_id, issuer_id, residual_risk_band, permit_types:permit_type_id(name)",
      )
      .eq("organization_id", organization.id)
      .or(
        `requester_id.eq.${user.id},issuer_id.eq.${user.id},work_leader_id.eq.${user.id},status.eq.approval_required,status.eq.authorization,status.eq.active,status.eq.suspended`,
      )
      .is("deleted_at", null)
      .order("valid_to", { ascending: true })
      .limit(30),
    supabase
      .from("permit_approvals")
      .select("permit_id")
      .eq("organization_id", organization.id)
      .eq("approver_id", user.id)
      .eq("approver_role", "field_ack"),
  ]);

  if (!entitled) return <FieldForbidden />;
  if (!canFieldAction(role, "my_permits")) return <FieldForbidden />;
  const canApprove = canFieldAction(role, "approve_permit");

  const { data: permits, error } = permitsRes;
  const acked = new Set((acksRes.data ?? []).map((a) => a.permit_id));

  const needingAction = (permits ?? []).filter(
    (p) =>
      ["approval_required", "authorization"].includes(p.status) ||
      (p.status === "active" && !acked.has(p.id)),
  );

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="My permits"
        subtitle="Active site permits and items requiring your action."
      />

      {needingAction.length ? (
        <p className="text-sm font-medium text-foreground">
          {needingAction.length} requiring action
        </p>
      ) : null}

      {error ? <FieldEmpty text={error.message} /> : null}
      {(permits ?? []).map((p) => {
        const c = permitCountdown(p.valid_to);
        const typeName = (p.permit_types as { name?: string } | null)?.name;
        return (
          <FieldCard key={p.id} className="space-y-3">
            <Link href={`/field/permits/${encodeURIComponent(p.permit_number)}`} className="block">
              <p className="text-lg font-medium text-foreground">
                {p.permit_number}
                {typeName ? ` · ${typeName}` : ""}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{p.title}</p>
              <p className="mt-1 text-xs capitalize text-muted-foreground">
                {String(p.status).replace(/_/g, " ")}
                {p.residual_risk_band ? ` · ${p.residual_risk_band} risk` : ""}
                {c ? (c.expired ? " · EXPIRED" : ` · ${c.label} left`) : ""}
              </p>
            </Link>
            {["approval_required", "authorization"].includes(p.status) && canApprove ? (
              <FieldSubmitForm action={approveFieldPermitAction} submitLabel="Approve & activate">
                <input type="hidden" name="permitId" value={p.id} />
                <input
                  name="signature"
                  placeholder="Signature name"
                  required
                  className={fieldControlClass}
                />
              </FieldSubmitForm>
            ) : null}
            {p.status === "active" && !acked.has(p.id) ? (
              <FieldSubmitForm action={acknowledgeFieldPermitAction} submitLabel="Acknowledge">
                <input type="hidden" name="permitId" value={p.id} />
                <input
                  name="signature"
                  placeholder="Signature name"
                  required
                  className={fieldControlClass}
                />
              </FieldSubmitForm>
            ) : null}
            {p.status === "active" || p.status === "expired" ? (
              <FieldSubmitForm
                action={requestFieldPermitRenewalAction}
                submitLabel="Request renewal"
              >
                <input type="hidden" name="permitId" value={p.id} />
              </FieldSubmitForm>
            ) : null}
          </FieldCard>
        );
      })}
      {!permits?.length && !error ? <FieldEmpty text="No permits assigned." /> : null}
    </div>
  );
}
