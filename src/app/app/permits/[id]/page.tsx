import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addCommentAction,
  addWorkerAction,
  decideApprovalAction,
  decideExtensionAction,
  linkRiskAction,
  requestExtensionAction,
  resumePermitAction,
  startCloseoutAction,
  suspendPermitAction,
  transitionPermitAction,
  updateChecklistItemAction,
  upsertIsolationAction,
  uploadPermitAttachmentsAction,
} from "@/app/actions/permits";
import { ActionForm } from "@/components/shared/action-form";
import {
  AttachmentGallery,
  MultiFileUploadForm,
} from "@/components/shared/attachment-gallery";
import { PermitQrCode } from "@/components/permits/permit-qr";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  canTransitionPermit,
  getPermitBundle,
  ISOLATION_TYPES,
  normalizePermitStatus,
  permitCountdown,
  permitValidityDisplay,
} from "@/lib/services/permits";
import { formatDate } from "@/lib/utils";

export default async function PermitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview" } = await searchParams;
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Permit to Work" />;
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getPermitBundle(access.supabase, access.organization.id, id);
  if (!bundle) notFound();

  const { permit, checklistItems, checklistGate, approvals, workers, isolations, extensions, history, comments, attachments } =
    bundle;
  const typeMeta = permit.permit_types as { code?: string; name?: string } | null;
  const risk = permit.risk_assessments as {
    id?: string;
    assessment_number?: string;
    title?: string;
    status?: string;
    residual_risk_band?: string;
    inherent_risk_band?: string;
    task_activity?: string;
  } | null;
  const countdown = permitCountdown(permit.valid_to);
  const display = permitValidityDisplay(permit.status, permit.valid_from, permit.valid_to);
  const from = normalizePermitStatus(permit.status);
  const candidates = [
    "requested",
    "under_review",
    "risk_review",
    "pre_work_checklist",
    "approval_required",
    "approved",
    "active",
    "suspended",
    "extension_pending",
    "closeout",
    "closed",
    "rejected",
    "cancelled",
    "expired",
  ].filter((to) => canTransitionPermit(permit.status, to) || canTransitionPermit(from, to));

  const tabs = [
    "overview",
    "risk",
    "checklist",
    "isolation",
    "approvals",
    "workers",
    "attachments",
    "comments",
    "timeline",
  ] as const;

  const { data: risks } = await access.supabase
    .from("risk_assessments")
    .select("id, assessment_number, title, status")
    .eq("organization_id", access.organization.id)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(40);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {typeMeta?.name ?? "Permit"} · {display}
            </p>
            <h1 className="text-2xl font-semibold text-primary">{permit.permit_number}</h1>
            <p className="text-sm text-muted-foreground">{permit.title}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {String(permit.status).replace(/_/g, " ")}
              </Badge>
              {permit.residual_risk_band ? (
                <Badge variant="outline" className="uppercase">
                  {permit.residual_risk_band} risk
                </Badge>
              ) : null}
            </div>
            <p className="mt-2 text-sm">
              {(permit.sites as { name?: string } | null)?.name ?? "—"}
              {(permit.locations as { name?: string } | null)?.name
                ? ` · ${(permit.locations as { name?: string }).name}`
                : ""}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase text-muted-foreground">Expires in</p>
            <p className="text-2xl font-semibold tabular-nums">
              {countdown?.label ?? "—"}
            </p>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/permits/print?id=${permit.id}`}>Print</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/app/permits/${permit.id}/closeout`}>Close-out</Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/app/permits/active">Active board</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-border pb-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/app/permits/${permit.id}?tab=${t}`}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize ${
              tab === t ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            {t}
          </Link>
        ))}
      </nav>

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Work</h2>
            <p className="whitespace-pre-wrap text-sm">{permit.work_description || "—"}</p>
            {permit.additional_controls ? (
              <div>
                <p className="text-xs text-muted-foreground">Additional controls</p>
                <p className="text-sm">{permit.additional_controls}</p>
              </div>
            ) : null}
            {checklistGate.message ? (
              <p className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm">
                {checklistGate.message}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Pre-work checklist complete.</p>
            )}
          </section>
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Actions</h2>
            {candidates.length ? (
              <ActionForm action={transitionPermitAction} className="space-y-2">
                <input type="hidden" name="organizationId" value={access.organization.id} />
                <input type="hidden" name="permitId" value={permit.id} />
                <Select name="toStatus" defaultValue={candidates[0]}>
                  {candidates.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
                <Input name="signatureName" placeholder="Signature (for activate)" />
                <Input name="reason" placeholder="Reason (optional)" />
                <Button type="submit" className="w-full">
                  Apply transition
                </Button>
              </ActionForm>
            ) : (
              <p className="text-sm text-muted-foreground">No transitions available.</p>
            )}
            {permit.status === "active" ? (
              <>
                <ActionForm action={suspendPermitAction} className="space-y-2 border-t border-border pt-3">
                  <input type="hidden" name="organizationId" value={access.organization.id} />
                  <input type="hidden" name="permitId" value={permit.id} />
                  <Select name="reasonCode" defaultValue="unsafe_condition">
                    <option value="unsafe_condition">Unsafe condition</option>
                    <option value="weather">Weather</option>
                    <option value="equipment_issue">Equipment issue</option>
                    <option value="emergency">Emergency</option>
                    <option value="procedure_violation">Procedure violation</option>
                    <option value="other">Other</option>
                  </Select>
                  <Input name="reason" placeholder="Suspension reason" required />
                  <Button type="submit" variant="outline" className="w-full">
                    Suspend
                  </Button>
                </ActionForm>
                <ActionForm action={requestExtensionAction} className="space-y-2 border-t border-border pt-3">
                  <input type="hidden" name="organizationId" value={access.organization.id} />
                  <input type="hidden" name="permitId" value={permit.id} />
                  <Input name="newValidTo" type="datetime-local" required />
                  <Input name="reason" placeholder="Extension reason" required />
                  <Button type="submit" variant="outline" className="w-full">
                    Request extension
                  </Button>
                </ActionForm>
                <ActionForm action={startCloseoutAction}>
                  <input type="hidden" name="organizationId" value={access.organization.id} />
                  <input type="hidden" name="permitId" value={permit.id} />
                  <Button type="submit" variant="outline" className="w-full">
                    Start close-out
                  </Button>
                </ActionForm>
              </>
            ) : null}
            {permit.status === "suspended" ? (
              <ActionForm action={resumePermitAction}>
                <input type="hidden" name="organizationId" value={access.organization.id} />
                <input type="hidden" name="permitId" value={permit.id} />
                <Button type="submit" className="w-full">
                  Resume
                </Button>
              </ActionForm>
            ) : null}
            {extensions
              .filter((e) => e.status === "pending")
              .map((e) => (
                <ActionForm key={e.id} action={decideExtensionAction} className="flex gap-2">
                  <input type="hidden" name="organizationId" value={access.organization.id} />
                  <input type="hidden" name="permitId" value={permit.id} />
                  <input type="hidden" name="extensionId" value={e.id} />
                  <Button type="submit" name="decision" value="approved" size="sm">
                    Approve ext
                  </Button>
                  <Button type="submit" name="decision" value="rejected" size="sm" variant="outline">
                    Reject ext
                  </Button>
                </ActionForm>
              ))}
            {permit.qr_token ? (
              <PermitQrCode
                path={`/field/permits/${permit.permit_number}`}
                label={permit.permit_number}
              />
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === "risk" ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Linked risk (from Risk Engine)</h2>
          {risk ? (
            <dl className="grid gap-2 text-sm md:grid-cols-2">
              <div>
                <dt className="text-muted-foreground">ID</dt>
                <dd>
                  <Link href={`/app/risk-assessments/${risk.id}`} className="text-accent underline">
                    {risk.assessment_number}
                  </Link>
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Status</dt>
                <dd className="capitalize">{risk.status}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Activity</dt>
                <dd>{risk.task_activity || risk.title}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Inherent / Residual</dt>
                <dd className="capitalize">
                  {risk.inherent_risk_band ?? "—"} / {risk.residual_risk_band ?? "—"}
                </dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">No risk linked yet.</p>
          )}
          <ActionForm action={linkRiskAction} className="grid gap-2 md:grid-cols-2">
            <input type="hidden" name="organizationId" value={access.organization.id} />
            <input type="hidden" name="permitId" value={permit.id} />
            <Select name="riskAssessmentId" defaultValue={permit.risk_assessment_id ?? ""}>
              <option value="">Select active assessment</option>
              {(risks ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.assessment_number} — {r.title}
                </option>
              ))}
            </Select>
            <Button type="submit">Link risk</Button>
          </ActionForm>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/risk-assessments">Create in Risk Engine</Link>
          </Button>
        </section>
      ) : null}

      {tab === "checklist" ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Pre-work checklist</h2>
          {checklistGate.message ? (
            <p className="text-sm text-amber-700 dark:text-amber-300">{checklistGate.message}</p>
          ) : null}
          <ul className="space-y-3">
            {checklistItems.map((item) => (
              <li key={item.id} className="rounded-xl border border-border p-3">
                <p className="text-sm font-medium">{item.item_text}</p>
                <ActionForm action={updateChecklistItemAction} className="mt-2 flex flex-wrap gap-2">
                  <input type="hidden" name="organizationId" value={access.organization.id} />
                  <input type="hidden" name="permitId" value={permit.id} />
                  <input type="hidden" name="itemId" value={item.id} />
                  <Select name="responseValue" defaultValue={item.response_value ?? ""}>
                    <option value="">Response</option>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                    <option value="na">N/A</option>
                    <option value="pass">Pass</option>
                    <option value="fail">Fail</option>
                  </Select>
                  <Input name="comment" placeholder="Comment" defaultValue={item.comment ?? ""} />
                  <Button type="submit" size="sm" variant="outline">
                    Save
                  </Button>
                </ActionForm>
              </li>
            ))}
            {!checklistItems.length ? (
              <li className="text-sm text-muted-foreground">No checklist items seeded for this type.</li>
            ) : null}
          </ul>
        </section>
      ) : null}

      {tab === "isolation" ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Isolation / LOTO</h2>
          <p className="text-xs text-muted-foreground">
            Digital control record — does not replace a formal customer LOTO procedure.
          </p>
          <ul className="space-y-2 text-sm">
            {isolations.map((iso) => (
              <li key={iso.id} className="border-b border-border py-2 capitalize">
                {iso.isolation_type} · {iso.status} · {iso.equipment || iso.isolation_point || "—"}
              </li>
            ))}
          </ul>
          <ActionForm action={upsertIsolationAction} className="grid gap-2 md:grid-cols-3">
            <input type="hidden" name="organizationId" value={access.organization.id} />
            <input type="hidden" name="permitId" value={permit.id} />
            <Select name="isolationType" defaultValue="electrical">
              {ISOLATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input name="equipment" placeholder="Equipment" />
            <Input name="energySource" placeholder="Energy source" />
            <Input name="isolationPoint" placeholder="Isolation point" />
            <Input name="method" placeholder="Method" />
            <Select name="status" defaultValue="required">
              <option value="required">Required</option>
              <option value="applied">Applied</option>
              <option value="verified">Verified</option>
              <option value="released">Released</option>
            </Select>
            <Button type="submit">Add isolation</Button>
          </ActionForm>
        </section>
      ) : null}

      {tab === "approvals" ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Approvals</h2>
          <ul className="space-y-3">
            {approvals.map((a) => (
              <li key={a.id} className="rounded-xl border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium capitalize">
                    L{a.approval_level} · {a.approver_role}
                  </p>
                  <Badge variant="secondary" className="capitalize">
                    {a.status}
                  </Badge>
                </div>
                {a.status === "pending" ? (
                  <ActionForm action={decideApprovalAction} className="mt-2 flex flex-wrap gap-2">
                    <input type="hidden" name="organizationId" value={access.organization.id} />
                    <input type="hidden" name="permitId" value={permit.id} />
                    <input type="hidden" name="approvalId" value={a.id} />
                    <Input name="signatureName" placeholder="Signature" />
                    <Input name="comment" placeholder="Comment" />
                    <Button type="submit" name="decision" value="approved" size="sm">
                      Approve
                    </Button>
                    <Button type="submit" name="decision" value="rejected" size="sm" variant="outline">
                      Reject
                    </Button>
                  </ActionForm>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

           {tab === "workers" ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Workers</h2>
          <ul className="space-y-2 text-sm">
            {workers.map((w) => (
              <li key={w.id}>
                {w.worker_name || w.user_id} · {w.role_label}
                {w.is_contractor ? " (contractor)" : ""}
              </li>
            ))}
          </ul>
          <ActionForm action={addWorkerAction} className="grid gap-2 md:grid-cols-3">
            <input type="hidden" name="organizationId" value={access.organization.id} />
            <input type="hidden" name="permitId" value={permit.id} />
            <Input name="workerName" placeholder="Name" required />
            <Input name="roleLabel" placeholder="Role" defaultValue="worker" />
            <Button type="submit">Add worker</Button>
          </ActionForm>
        </section>
      ) : null}

      {tab === "attachments" ? (
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Photos & files</h2>
          <p className="text-xs text-muted-foreground">
            Stored in private Supabase Storage (`ehs-attachments`). Multiple photos/PDFs allowed
            (max 12 per upload, 15 MB each).
          </p>
          <MultiFileUploadForm
            action={uploadPermitAttachmentsAction}
            organizationId={access.organization.id}
            entityFieldName="permitId"
            entityId={permit.id}
          />
          <AttachmentGallery items={attachments} />
        </section>
      ) : null}

      {tab === "comments" ? (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Comments</h2>
          <ul className="space-y-2 text-sm">
            {comments.map((c) => (
              <li key={c.id} className="border-b border-border py-2">
                <p>{c.body}</p>
                <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
              </li>
            ))}
          </ul>
          <ActionForm action={addCommentAction} className="space-y-2">
            <input type="hidden" name="organizationId" value={access.organization.id} />
            <input type="hidden" name="permitId" value={permit.id} />
            <Textarea name="body" required rows={2} />
            <Button type="submit">Add comment</Button>
          </ActionForm>
        </section>
      ) : null}

      {tab === "timeline" ? (
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Timeline</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {history.map((h) => (
              <li key={h.id} className="border-b border-border py-2">
                <p>{h.message}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDate(h.created_at)} · {h.event_type}
                </p>
              </li>
            ))}
            {!history.length ? (
              <li className="text-muted-foreground">No history yet.</li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
