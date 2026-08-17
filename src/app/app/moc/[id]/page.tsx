import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addMocCapaAction,
  addMocImpactAction,
  decideMocApprovalAction,
  implementMocAction,
  linkMocDocumentAction,
  linkMocRiskAction,
  transitionMocAction,
  verifyMocAction,
} from "@/app/actions/moc";
import { ActionForm } from "@/components/shared/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { canTransitionMoc, getMocBundle, MOC_STATUSES } from "@/lib/services/moc";

export default async function MocDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const access = await requireModuleAccess({ featureCode: "moc", permission: "moc.view" });
  if (!access.entitled) return <UpgradeState featureName="Management of Change" />;
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getMocBundle(access.supabase, access.organization.id, id);
  if (!bundle) notFound();
  const { moc, impacts, approvals, history, documents, capas } = bundle;
  const next = MOC_STATUSES.filter((s) => canTransitionMoc(moc.status, s));

  const [{ data: risks }, { data: docs }] = await Promise.all([
    access.supabase
      .from("risk_assessments")
      .select("id, assessment_number, title")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .limit(40),
    access.supabase
      .from("controlled_documents")
      .select("id, doc_number, title")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .limit(40),
  ]);

  const risk = moc.risk_assessments as { assessment_number?: string; title?: string; status?: string } | null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{moc.moc_number}</p>
          <h1 className="text-xl font-semibold">{moc.title}</h1>
          <Badge variant="secondary" className="mt-1 capitalize">
            {String(moc.status).replace(/_/g, " ")}
          </Badge>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/app/moc">Back</Link>
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">{moc.description}</p>
      <p className="text-sm">
        Risk: {risk ? `${risk.assessment_number} ${risk.title} (${risk.status})` : "not linked"}
      </p>

      {next.length ? (
        <ActionForm action={transitionMocAction} className="flex flex-wrap gap-2">
          <input type="hidden" name="mocId" value={moc.id} />
          {next.map((status) => (
            <Button key={status} type="submit" name="toStatus" value={status} size="sm" variant="outline">
              {status.replace(/_/g, " ")}
            </Button>
          ))}
        </ActionForm>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Impact</h2>
          <ul className="text-sm">
            {impacts.map((i) => (
              <li key={i.id}>
                {i.area} · {i.severity} {i.description ? `— ${i.description}` : ""}
              </li>
            ))}
          </ul>
          <ActionForm action={addMocImpactAction} className="grid gap-2">
            <input type="hidden" name="mocId" value={moc.id} />
            <Input name="area" placeholder="Area (process, people, environment…)" required />
            <Select name="severity" defaultValue="medium">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </Select>
            <Input name="description" placeholder="Notes" />
            <Button type="submit" size="sm">
              Add impact
            </Button>
          </ActionForm>
        </section>
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Risk link</h2>
          <ActionForm action={linkMocRiskAction} className="grid gap-2">
            <input type="hidden" name="mocId" value={moc.id} />
            <Select name="riskAssessmentId" required>
              <option value="">Select RA / JSA / JHA</option>
              {(risks ?? []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.assessment_number} {r.title}
                </option>
              ))}
            </Select>
            <Button type="submit" size="sm" variant="outline">
              Link risk
            </Button>
          </ActionForm>
        </section>
      </div>

      {moc.status === "approval" ? (
        <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <h2 className="text-sm font-semibold">Approval</h2>
          <ActionForm action={decideMocApprovalAction} className="grid gap-2">
            <input type="hidden" name="mocId" value={moc.id} />
            <Textarea name="comments" placeholder="Comments" />
            <div className="flex gap-2">
              <Button type="submit" name="decision" value="approved" size="sm">
                Approve
              </Button>
              <Button type="submit" name="decision" value="rejected" size="sm" variant="outline">
                Reject
              </Button>
            </div>
          </ActionForm>
          <ul className="text-xs text-muted-foreground">
            {approvals.map((a) => (
              <li key={a.id}>
                {a.decision} · {(a.profiles as { full_name?: string } | null)?.full_name}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {moc.status === "implementation" ? (
        <ActionForm action={implementMocAction} className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <input type="hidden" name="mocId" value={moc.id} />
          <Textarea name="notes" placeholder="Implementation notes" />
          <Button type="submit" size="sm">
            Mark implemented
          </Button>
        </ActionForm>
      ) : null}

      {moc.status === "post_change_verification" ? (
        <ActionForm action={verifyMocAction} className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <input type="hidden" name="mocId" value={moc.id} />
          <Textarea name="notes" placeholder="Verification notes" />
          <Button type="submit" size="sm">
            Verify and close
          </Button>
        </ActionForm>
      ) : null}

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">CAPA actions</h2>
        <ul className="text-sm">
          {capas.map((c) => (
            <li key={c.id}>
              <Link href="/app/capa" className="text-accent hover:underline">
                {c.title}
              </Link>{" "}
              · {c.status}
            </li>
          ))}
        </ul>
        <ActionForm action={addMocCapaAction} className="grid gap-2">
          <input type="hidden" name="mocId" value={moc.id} />
          <Input name="title" placeholder="Action title" required />
          <Input name="dueDate" type="date" />
          <Button type="submit" size="sm">
            Create CAPA
          </Button>
        </ActionForm>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <h2 className="text-sm font-semibold">Linked documents</h2>
        <ul className="text-sm">
          {documents.map((d) => {
            const doc = d.controlled_documents as { id?: string; doc_number?: string; title?: string } | null;
            return (
              <li key={d.id}>
                {doc?.id ? (
                  <Link href={`/app/documents/${doc.id}`} className="text-accent hover:underline">
                    {doc.doc_number} {doc.title}
                  </Link>
                ) : (
                  d.document_id
                )}
              </li>
            );
          })}
        </ul>
        <ActionForm action={linkMocDocumentAction} className="grid gap-2 sm:grid-cols-2">
          <input type="hidden" name="mocId" value={moc.id} />
          <Select name="documentId" required>
            <option value="">Controlled document</option>
            {(docs ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.doc_number} {d.title}
              </option>
            ))}
          </Select>
          <Button type="submit" size="sm">
            Link document
          </Button>
        </ActionForm>
      </section>

      <section className="text-xs text-muted-foreground space-y-1">
        {history.map((h) => (
          <p key={h.id}>
            {h.event_type} {h.from_status ? `${h.from_status} → ${h.to_status}` : ""} {h.message ?? ""}
          </p>
        ))}
      </section>
    </div>
  );
}
