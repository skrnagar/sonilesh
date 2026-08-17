import Link from "next/link";
import { notFound } from "next/navigation";
import {
  acknowledgeDocumentAction,
  addDocumentVersionAction,
  decideDocumentVersionAction,
  distributeDocumentAction,
  linkDocumentAction,
  publishDocumentVersionAction,
  scheduleDocumentReviewAction,
  submitDocumentVersionAction,
} from "@/app/actions/documents";
import { ActionForm } from "@/components/shared/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { DOCUMENT_LINK_SOURCE_TYPES, getDocumentBundle } from "@/lib/services/documents";
import { formatDate } from "@/lib/utils";

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireModuleAccess({
    featureCode: "document_control",
    permission: "documents.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Document control" />;
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getDocumentBundle(access.supabase, access.organization.id, id);
  if (!bundle) notFound();
  const { document: doc, versions, acknowledgements, links, distribution, approvals } = bundle;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{doc.doc_number}</p>
          <h1 className="text-xl font-semibold">{doc.title}</h1>
          <div className="mt-1 flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {String(doc.status).replace(/_/g, " ")}
            </Badge>
            {(doc.tags ?? []).map((tag: string) => (
              <Badge key={tag} variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/documents">Back</Link>
        </Button>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Versions</h2>
        <p className="text-xs text-muted-foreground">
          Published versions are immutable. Download uses a signed URL from the private bucket.
        </p>
        <ul className="space-y-2 text-sm">
          {versions.map((v) => (
            <li key={v.id} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span>
                  v{v.version} · {v.status}
                  {v.is_current ? " · current" : ""}
                </span>
                {v.signed_url ? (
                  <a href={v.signed_url} target="_blank" rel="noreferrer" className="text-accent underline">
                    {v.file_name || "Open file"}
                  </a>
                ) : (
                  <span className="text-muted-foreground">{v.file_name || "No file"}</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {v.status === "draft" ? (
                  <ActionForm action={submitDocumentVersionAction}>
                    <input type="hidden" name="documentId" value={doc.id} />
                    <input type="hidden" name="versionId" value={v.id} />
                    <Button type="submit" size="sm" variant="outline">
                      Submit review
                    </Button>
                  </ActionForm>
                ) : null}
                {v.status === "in_review" ? (
                  <ActionForm action={decideDocumentVersionAction} className="flex gap-2">
                    <input type="hidden" name="documentId" value={doc.id} />
                    <input type="hidden" name="versionId" value={v.id} />
                    <Button type="submit" name="decision" value="approved" size="sm">
                      Approve
                    </Button>
                    <Button type="submit" name="decision" value="rejected" size="sm" variant="outline">
                      Reject
                    </Button>
                  </ActionForm>
                ) : null}
                {v.status === "approved" ? (
                  <ActionForm action={publishDocumentVersionAction}>
                    <input type="hidden" name="documentId" value={doc.id} />
                    <input type="hidden" name="versionId" value={v.id} />
                    <Button type="submit" size="sm">
                      Publish
                    </Button>
                  </ActionForm>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
        <ActionForm action={addDocumentVersionAction} className="grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="documentId" value={doc.id} />
          <Input name="version" placeholder="Version" />
          <Input name="changeSummary" placeholder="Change summary" />
          <Input name="file" type="file" />
          <Button type="submit" size="sm" className="sm:col-span-3">
            Add version
          </Button>
        </ActionForm>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Acknowledgement</h2>
          <p className="text-xs text-muted-foreground">{acknowledgements.length} recorded</p>
          <ActionForm action={acknowledgeDocumentAction}>
            <input type="hidden" name="documentId" value={doc.id} />
            <input type="hidden" name="versionId" value={doc.current_version_id ?? ""} />
            <Button type="submit" size="sm">
              I acknowledge this document
            </Button>
          </ActionForm>
        </section>
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Distribution & review</h2>
          <ActionForm action={distributeDocumentAction} className="grid gap-2">
            <input type="hidden" name="documentId" value={doc.id} />
            <Select name="audienceType" defaultValue="org">
              <option value="org">Whole organization</option>
              <option value="role">Role</option>
              <option value="site">Site</option>
              <option value="user">User</option>
            </Select>
            <Input name="audienceKey" placeholder="Audience key (all / role code / site id)" defaultValue="all" />
            <Button type="submit" size="sm" variant="outline">
              Distribute
            </Button>
          </ActionForm>
          <ActionForm action={scheduleDocumentReviewAction} className="grid gap-2">
            <input type="hidden" name="documentId" value={doc.id} />
            <Label htmlFor="dueOn">Review due</Label>
            <Input id="dueOn" name="dueOn" type="date" required />
            <Button type="submit" size="sm" variant="outline">
              Schedule review
            </Button>
          </ActionForm>
          <p className="text-xs text-muted-foreground">{distribution.length} distribution rows</p>
        </section>
      </div>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Cross-module links</h2>
        <ul className="text-sm text-muted-foreground">
          {links.map((l) => (
            <li key={l.id}>
              {l.source_type} · {l.source_id}
            </li>
          ))}
        </ul>
        <ActionForm action={linkDocumentAction} className="grid gap-2 sm:grid-cols-3">
          <input type="hidden" name="documentId" value={doc.id} />
          <Select name="sourceType" defaultValue="contractor_document">
            {DOCUMENT_LINK_SOURCE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
          <Input name="sourceId" placeholder="Source record id" />
          <Button type="submit" size="sm">
            Link
          </Button>
        </ActionForm>
      </section>

      <p className="text-xs text-muted-foreground">
        Approvals: {approvals.length} · Expires {formatDate(doc.expires_on)} · Review {formatDate(doc.review_due_on)}
      </p>
    </div>
  );
}
