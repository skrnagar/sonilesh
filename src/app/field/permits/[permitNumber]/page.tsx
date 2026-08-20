import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgContext } from "@/lib/auth/org-context";
import { canFieldAction } from "@/lib/auth/field-roles";
import { getPermitBundle } from "@/lib/services/permits";
import { permitCountdown } from "@/lib/field/permit-countdown";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import {
  acknowledgeFieldPermitAction,
  approveFieldPermitAction,
} from "@/app/actions/field";
import { uploadPermitAttachmentsAction } from "@/app/actions/permits";
import { FieldSubmitForm } from "@/components/field/field-submit-form";
import {
  AttachmentGallery,
  MultiFileUploadForm,
} from "@/components/shared/attachment-gallery";
import {
  FieldCard,
  FieldEmpty,
  FieldForbidden,
  FieldPageHeader,
  fieldControlClass,
} from "@/components/field/field-ui";
import { hasFeature } from "@/lib/services/entitlements";
import { isFieldPermitParty } from "@/lib/field/permits";

export default async function FieldPermitDetailPage({
  params,
}: {
  params: Promise<{ permitNumber: string }>;
}) {
  const { permitNumber } = await params;
  const decoded = decodeURIComponent(permitNumber);
  const { supabase, user, organization, membershipId } = await requireOrgContext();

  const [entitled, role, rowRes] = await Promise.all([
    hasFeature(supabase, organization.id, "permit_to_work"),
    resolveFieldRole(supabase, membershipId),
    supabase
      .from("permits")
      .select("id, requester_id, issuer_id, work_leader_id, status")
      .eq("organization_id", organization.id)
      .eq("permit_number", decoded)
      .is("deleted_at", null)
      .maybeSingle(),
  ]);

  if (!entitled) return <FieldForbidden />;
  if (!canFieldAction(role, "my_permits")) return <FieldForbidden />;
  const canApprove = canFieldAction(role, "approve_permit");

  const row = rowRes.data;
  if (!row) notFound();

  const { data: workerRow } = await supabase
    .from("permit_workers")
    .select("id")
    .eq("permit_id", row.id)
    .eq("organization_id", organization.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!canApprove && !isFieldPermitParty(row, user.id) && !workerRow) {
    return <FieldForbidden />;
  }

  const bundle = await getPermitBundle(supabase, organization.id, row.id);
  if (!bundle) notFound();
  const { permit, checklistItems, approvals, isolations, workers, checklistGate, attachments } =
    bundle;
  const c = permitCountdown(permit.valid_to);
  const typeName = (permit.permit_types as { name?: string } | null)?.name;

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title={permit.permit_number}
        subtitle={`${typeName ?? "Permit"} · ${permit.title}`}
      />
      <FieldCard className="space-y-2">
        <p className="text-sm capitalize">
          Status: {String(permit.status).replace(/_/g, " ")}
        </p>
        <p className="text-sm">
          Risk: {permit.residual_risk_band ?? "—"} · Expiry: {c?.label ?? "—"}
        </p>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">
          {permit.work_description || "No description"}
        </p>
      </FieldCard>

      <FieldCard className="space-y-2">
        <p className="font-medium">Checklist</p>
        {checklistGate.message ? (
          <p className="text-sm text-amber-700 dark:text-amber-300">{checklistGate.message}</p>
        ) : (
          <p className="text-sm text-muted-foreground">Checklist ready</p>
        )}
        <ul className="space-y-1 text-sm">
          {checklistItems.slice(0, 8).map((i) => (
            <li key={i.id}>
              {i.is_checked || i.response_value ? "✓" : "○"} {i.item_text}
            </li>
          ))}
        </ul>
      </FieldCard>

      <FieldCard className="space-y-2">
        <p className="font-medium">Approvals</p>
        <ul className="space-y-1 text-sm capitalize">
          {approvals.map((a) => (
            <li key={a.id}>
              {a.approver_role}: {a.status}
            </li>
          ))}
        </ul>
      </FieldCard>

      {isolations.length ? (
        <FieldCard className="space-y-2">
          <p className="font-medium">Isolation</p>
          <ul className="space-y-1 text-sm capitalize">
            {isolations.map((i) => (
              <li key={i.id}>
                {i.isolation_type}: {i.status}
              </li>
            ))}
          </ul>
        </FieldCard>
      ) : null}

      <FieldCard className="space-y-3">
        <p className="font-medium">Photos & evidence</p>
        <MultiFileUploadForm
          action={uploadPermitAttachmentsAction}
          organizationId={organization.id}
          entityFieldName="permitId"
          entityId={permit.id}
          label="Add photos"
          accept="image/jpeg,image/png,image/webp,image/gif"
        />
        <AttachmentGallery items={attachments} />
      </FieldCard>

      <FieldCard className="space-y-2">
        <p className="font-medium">Workers</p>
        {workers.length ? (
          <ul className="space-y-1 text-sm">
            {workers.map((w) => (
              <li key={w.id}>
                {w.worker_name || "Worker"} · {w.role_label}
              </li>
            ))}
          </ul>
        ) : (
          <FieldEmpty text="No workers listed." />
        )}
      </FieldCard>

      {["approval_required", "authorization", "approved"].includes(permit.status) &&
      canApprove ? (
        <FieldSubmitForm action={approveFieldPermitAction} submitLabel="Approve & activate">
          <input type="hidden" name="permitId" value={permit.id} />
          <input
            name="signature"
            placeholder="Signature name"
            required
            className={fieldControlClass}
            defaultValue={user.email ?? ""}
          />
        </FieldSubmitForm>
      ) : null}

      {permit.status === "active" &&
      (isFieldPermitParty(permit, user.id) || workerRow) ? (
        <FieldSubmitForm action={acknowledgeFieldPermitAction} submitLabel="Acknowledge">
          <input type="hidden" name="permitId" value={permit.id} />
          <input
            name="signature"
            placeholder="Signature name"
            required
            className={fieldControlClass}
          />
        </FieldSubmitForm>
      ) : null}

      <Link href="/field/permits" className="block text-center text-sm text-accent underline">
        Back to permits
      </Link>
    </div>
  );
}
