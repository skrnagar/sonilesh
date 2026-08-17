import Link from "next/link";
import { notFound } from "next/navigation";
import {
  completeAssignmentAction,
  linkFindingCapaAction,
  saveResponseAction,
  transitionAssignmentAction,
  uploadChecklistEvidenceAction,
} from "@/app/actions/checklists";
import { ActionForm } from "@/components/shared/action-form";
import {
  AttachmentGallery,
  MultiFileUploadForm,
} from "@/components/shared/attachment-gallery";
import { createSignedAttachmentUrl } from "@/lib/services/attachments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  canTransitionChecklist,
  getAssignmentBundle,
  type ChecklistType,
} from "@/lib/services/checklists";

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireModuleAccess({
    featureCode: "audits",
    permission: "audits.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Audits" />;
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getAssignmentBundle(access.supabase, access.organization.id, id);
  if (!bundle || bundle.assignment.checklist_type !== "audit") notFound();

  const { assignment, sections, questions, responses, findings, evidence } = bundle;
  const template = assignment.checklist_templates as {
    name?: string;
    auto_capa_on_fail?: boolean;
  } | null;
  const type = "audit" as ChecklistType;

  const candidates = [
    "auditee_notified",
    "in_progress",
    "conducted",
    "completed",
    "findings_recorded",
    "under_review",
    "approved",
    "report_issued",
    "closed",
    "cancelled",
  ].filter((to) => canTransitionChecklist(type, assignment.status, to));

  const evidenceViews = await Promise.all(
    evidence.map(async (e) => {
      let url: string | null = null;
      try {
        url = await createSignedAttachmentUrl(access.supabase, e.storage_path);
      } catch {
        url = null;
      }
      return {
        id: e.id,
        file_name: e.file_name,
        content_type: e.content_type as string | null,
        file_size: e.file_size as number | null,
        storage_path: e.storage_path,
        kind: (String(e.content_type || "").startsWith("image/")
          ? "photo"
          : "document") as "photo" | "document",
        url,
      };
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase text-muted-foreground">{template?.name ?? "Audit"}</p>
          <h1 className="text-xl font-semibold text-primary">{assignment.assignment_number}</h1>
          <p className="text-sm text-muted-foreground">{assignment.title}</p>
          <Badge variant="secondary" className="mt-2 capitalize">
            {String(assignment.status).replace(/_/g, " ")}
          </Badge>
          {assignment.score_percent != null ? (
            <Badge variant="outline" className="ml-2">
              {assignment.score_percent}%
            </Badge>
          ) : null}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/audits">Back</Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Audit checklist</h2>
          {sections.map((section) => (
            <div key={section.id} className="space-y-3">
              <h3 className="text-xs font-semibold uppercase text-muted-foreground">{section.title}</h3>
              {questions
                .filter((q) => q.section_id === section.id)
                .map((q) => {
                  const resp = responses.find((r) => r.question_id === q.id);
                  return (
                    <article key={q.id} className="rounded-xl border border-border p-3">
                      <p className="text-sm font-medium">{q.prompt}</p>
                      <ActionForm action={saveResponseAction} className="mt-2 flex flex-wrap gap-2">
                        <input type="hidden" name="organizationId" value={access.organization.id} />
                        <input type="hidden" name="assignmentId" value={assignment.id} />
                        <input type="hidden" name="questionId" value={q.id} />
                        <input type="hidden" name="checklistType" value="audit" />
                        <input
                          type="hidden"
                          name="autoCapa"
                          value={template?.auto_capa_on_fail ? "1" : "0"}
                        />
                        <Select name="value" defaultValue={resp?.value_text ?? "pass"}>
                          <option value="pass">Pass / Conform</option>
                          <option value="fail">Fail / NC</option>
                          <option value="na">N/A</option>
                        </Select>
                        <Input name="comment" placeholder="Evidence / note" defaultValue={resp?.comment ?? ""} />
                        <Button type="submit" size="sm" variant="outline">
                          Save
                        </Button>
                      </ActionForm>
                    </article>
                  );
                })}
            </div>
          ))}
          <ActionForm action={completeAssignmentAction}>
            <input type="hidden" name="organizationId" value={access.organization.id} />
            <input type="hidden" name="assignmentId" value={assignment.id} />
            <input type="hidden" name="checklistType" value="audit" />
            <Textarea name="reportNotes" placeholder="Audit report notes" className="mb-2" />
            <Button type="submit">Complete & score</Button>
          </ActionForm>
        </section>

        <div className="space-y-4">
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Workflow</h2>
            {candidates.length ? (
              <ActionForm action={transitionAssignmentAction} className="mt-3 space-y-2">
                <input type="hidden" name="organizationId" value={access.organization.id} />
                <input type="hidden" name="assignmentId" value={assignment.id} />
                <input type="hidden" name="checklistType" value="audit" />
                <Select name="toStatus" defaultValue={candidates[0]}>
                  {candidates.map((s) => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, " ")}
                    </option>
                  ))}
                </Select>
                <Button type="submit" className="w-full">
                  Apply
                </Button>
              </ActionForm>
            ) : null}
          </section>
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Findings</h2>
            <ul className="mt-2 space-y-2 text-sm">
              {findings.map((f) => (
                <li key={f.id} className="border-b border-border py-2">
                  <p className="font-medium">{f.title}</p>
                  {!f.capa_id ? (
                    <ActionForm action={linkFindingCapaAction} className="mt-1">
                      <input type="hidden" name="organizationId" value={access.organization.id} />
                      <input type="hidden" name="findingId" value={f.id} />
                      <input type="hidden" name="checklistType" value="audit" />
                      <Button type="submit" size="sm" variant="outline">
                        Create CAPA
                      </Button>
                    </ActionForm>
                  ) : (
                    <p className="text-xs text-muted-foreground">CAPA linked</p>
                  )}
                </li>
              ))}
              {!findings.length ? <li className="text-muted-foreground">No findings.</li> : null}
            </ul>
          </section>
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Evidence</h2>
            <MultiFileUploadForm
              action={uploadChecklistEvidenceAction}
              organizationId={access.organization.id}
              entityFieldName="assignmentId"
              entityId={assignment.id}
              extraFields={{ checklistType: "audit" }}
            />
            <AttachmentGallery items={evidenceViews} />
          </section>
        </div>
      </div>
    </div>
  );
}
