import Link from "next/link";
import { notFound } from "next/navigation";
import {
  addContractorContactAction,
  createContractorWorkerAction,
  inviteContractorContactAction,
  recordPerformanceAction,
  startPrequalificationAction,
  transitionContractorAction,
  uploadContractorDocumentAction,
  verifyContractorDocumentAction,
} from "@/app/actions/contractors";
import { ContractorTabs } from "@/components/contractors/contractor-tabs";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { ActionForm } from "@/components/shared/action-form";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { permissionFlags } from "@/lib/services/rbac";
import { listTemplates } from "@/lib/services/checklists";
import {
  getCompanyReadiness,
  getContractorBundle,
} from "@/lib/services/contractors";

export default async function ContractorDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; inviteToken?: string }>;
}) {
  const { id } = await params;
  const { tab = "overview", inviteToken } = await searchParams;
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const flags = await permissionFlags(access.supabase, access.organization.id, access.user.id);
  const canUpdate = flags.hasAny(["contractor.update", "contractor.manage"]);
  const canApprove = flags.hasAny(["contractor.approve", "contractor.manage"]);
  const canManageWorkers = flags.hasAny(["contractor_worker.manage", "contractor.manage"]);
  const canManageDocs = flags.hasAny(["contractor_document.manage", "contractor.manage"]);
  const canVerifyDocs = flags.hasAny(["contractor_document.verify", "contractor.manage"]);

  let bundle;
  try {
    bundle = await getContractorBundle(access.supabase, access.organization.id, id);
  } catch {
    notFound();
  }

  const [templates, readiness] = await Promise.all([
    listTemplates(access.supabase, access.organization.id, "contractor"),
    getCompanyReadiness(access.supabase, {
      organizationId: access.organization.id,
      companyId: id,
    }),
  ]);
  const company = bundle.company;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">
            <Link href="/app/contractors" className="hover:underline">
              Contractors
            </Link>
          </p>
          <h1 className="text-xl font-semibold">{company.name}</h1>
          <p className="text-sm text-muted-foreground">
            {company.legal_name ?? "No legal name"} · {company.city ?? "—"}
          </p>
        </div>
        <StatusPill value={company.status} />
      </div>
      <ContractorsNav current="/app/contractors" />
      <ContractorTabs companyId={id} current={tab} />

      {inviteToken ? (
        <div className="rounded-xl border border-border bg-card p-3 text-sm">
          Share this portal invite once:{" "}
          <code className="break-all text-xs">/contractor/invite/accept?token={inviteToken}</code>
        </div>
      ) : null}

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className="space-y-2 rounded-2xl border border-border bg-card p-4 text-sm">
            <h2 className="font-semibold">Company</h2>
            <p>Email: {company.email ?? "—"}</p>
            <p>Phone: {company.phone ?? "—"}</p>
            <p>GSTIN: {company.gstin ?? "—"}</p>
            <p>PAN: {company.pan ?? "—"}</p>
            <p>Insurance: {company.insurance_expires_on ?? "—"}</p>
            <p>Safety score: {company.safety_score ?? "—"}</p>
          </section>
          {canApprove ? (
          <ActionForm action={transitionContractorAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Status change</h2>
            <input type="hidden" name="companyId" value={id} />
            <Select name="toStatus" defaultValue="active">
              <option value="approved">Approved</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blacklisted">Blacklisted</option>
              <option value="deactivated">Deactivated</option>
            </Select>
            <Textarea name="reason" placeholder="Reason" rows={2} />
            <Button type="submit">Apply</Button>
          </ActionForm>
          ) : null}
          {canUpdate ? (
          <ActionForm action={addContractorContactAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Add contact</h2>
            <input type="hidden" name="companyId" value={id} />
            <Input name="fullName" placeholder="Name" required />
            <Input name="email" type="email" placeholder="Email" />
            <Button type="submit">Add</Button>
          </ActionForm>
          ) : null}
          {canUpdate ? (
          <ActionForm action={inviteContractorContactAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Portal invite</h2>
            <input type="hidden" name="companyId" value={id} />
            <Input name="email" type="email" placeholder="Contact email" required />
            <Input name="fullName" placeholder="Name" />
            <Button type="submit">Invite to /contractor</Button>
          </ActionForm>
          ) : null}
        </div>
      ) : null}

      {tab === "workers" ? (
        <div className="space-y-4">
          {canManageWorkers ? (
          <ActionForm action={createContractorWorkerAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
            <input type="hidden" name="companyId" value={id} />
            <Input name="fullName" placeholder="Full name" required />
            <Input name="trade" placeholder="Trade" />
            <Input name="employeeNumber" placeholder="Employee no." />
            <Button type="submit">Add worker</Button>
          </ActionForm>
          ) : null}
          <RecordsTable
            columns={["Name", "Trade", "Status", "Induction", "Profile"]}
            empty="No workers."
            rows={bundle.workers.map((w) => [
              w.full_name,
              w.trade ?? "—",
              <StatusPill key="s" value={w.status} />,
              w.induction_completed_at ? "Yes" : "No",
              w.profile_id ? "Linked" : "—",
            ])}
          />
        </div>
      ) : null}

      {tab === "documents" ? (
        <div className="space-y-4">
          {canManageDocs ? (
          <ActionForm action={uploadContractorDocumentAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-4">
            <input type="hidden" name="companyId" value={id} />
            <Input name="title" placeholder="Title" required />
            <Input name="docType" placeholder="Type (e.g. insurance)" required />
            <Input name="expiresOn" type="date" />
            <Input name="file" type="file" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isMandatory" /> Mandatory
            </label>
            <Button type="submit">Upload</Button>
          </ActionForm>
          ) : null}
          <RecordsTable
            columns={["Title", "Type", "Expires", "Verify", "Action"]}
            empty="No documents."
            rows={bundle.documents.map((d) => [
              d.title,
              d.doc_type,
              d.expires_on ?? "—",
              <StatusPill key="v" value={d.verification_status} />,
              d.verification_status === "pending" && canVerifyDocs ? (
                <ActionForm key={d.id} action={verifyContractorDocumentAction} className="flex gap-2">
                  <input type="hidden" name="documentId" value={d.id} />
                  <input type="hidden" name="companyId" value={id} />
                  <Button type="submit" name="decision" value="verified" size="sm">
                    Verify
                  </Button>
                  <Button type="submit" name="decision" value="rejected" size="sm" variant="outline">
                    Reject
                  </Button>
                </ActionForm>
              ) : (
                "—"
              ),
            ])}
          />
        </div>
      ) : null}

      {tab === "prequalification" ? (
        <div className="space-y-4">
          {canUpdate ? (
          <ActionForm action={startPrequalificationAction} className="flex flex-wrap items-end gap-3">
            <input type="hidden" name="companyId" value={id} />
            <div className="space-y-1">
              <Label>Template</Label>
              <Select name="templateId" defaultValue={templates[0]?.id ?? ""}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={!templates.length}>
              Start
            </Button>
          </ActionForm>
          ) : null}
          <RecordsTable
            columns={["Status", "Outcome", "Score"]}
            empty="No prequalification yet."
            rows={bundle.prequalification.map((p) => [
              <StatusPill key="s" value={p.status} />,
              p.outcome ?? "—",
              p.score_percent ?? "—",
            ])}
          />
        </div>
      ) : null}

      {tab === "contracts" ? (
        <RecordsTable
          columns={["Title", "Number", "Status", "Ends"]}
          empty="No contracts."
          rows={bundle.contracts.map((c) => [
            c.title,
            c.contract_number ?? "—",
            <StatusPill key="s" value={c.status} />,
            c.ends_on ?? "—",
          ])}
        />
      ) : null}

      {tab === "assignments" ? (
        <div className="space-y-4">
          <RecordsTable
            columns={["Site", "Status"]}
            empty="No site assignments."
            rows={bundle.siteAssignments.map((a) => [
              (a.sites as { name?: string } | null)?.name ?? a.site_id,
              <StatusPill key="s" value={a.status} />,
            ])}
          />
          <RecordsTable
            columns={["Project", "Status"]}
            empty="No project assignments."
            rows={bundle.projectAssignments.map((a) => [
              (a.projects as { name?: string } | null)?.name ?? a.project_id,
              <StatusPill key="s" value={a.status} />,
            ])}
          />
        </div>
      ) : null}

      {tab === "assessments" ? (
        <RecordsTable
          columns={["Title", "Status", "Score", "Open"]}
          empty="No assessments."
          rows={bundle.assessments.map((a) => [
            a.title ?? "—",
            <StatusPill key="s" value={a.status} />,
            a.score_percent ?? "—",
            <Link key="l" href={`/app/inspections/${a.checklist_assignment_id}`} className="underline">
              Checklist
            </Link>,
          ])}
        />
      ) : null}

      {tab === "performance" ? (
        <div className="space-y-4">
          {canUpdate ? (
          <ActionForm action={recordPerformanceAction} className="flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4">
            <input type="hidden" name="companyId" value={id} />
            <Input name="safetyScore" type="number" placeholder="Score" />
            <Button type="submit">Record score</Button>
          </ActionForm>
          ) : null}
          <RecordsTable
            columns={["Score", "Incidents", "Findings", "CAPA", "Notes"]}
            empty="No performance rows."
            rows={bundle.performance.map((p) => [
              p.safety_score ?? "—",
              p.incidents_count,
              p.findings_count,
              p.capa_open_count,
              p.notes ?? "—",
            ])}
          />
        </div>
      ) : null}

      {tab === "readiness" ? (
        <div className="rounded-2xl border border-border bg-card p-4 text-sm">
          <p className="font-semibold">{readiness.ready ? "Ready" : "Not ready"}</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {readiness.gaps.map((g) => (
              <li key={g.code + g.message}>{g.message}</li>
            ))}
          </ul>
          {readiness.trainingTodo ? (
            <p className="mt-3 text-muted-foreground">{readiness.trainingTodo}</p>
          ) : null}
        </div>
      ) : null}

      {tab === "history" ? (
        <RecordsTable
          columns={["From", "To", "Reason", "When"]}
          empty="No status history."
          rows={bundle.history.map((h) => [
            h.from_status ?? "—",
            h.to_status,
            h.reason ?? "—",
            h.created_at?.slice(0, 16) ?? "—",
          ])}
        />
      ) : null}

      {tab === "inductions" ? (
        <p className="text-sm text-muted-foreground">
          Record inductions on the{" "}
          <Link href="/app/contractors/inductions" className="underline">
            inductions
          </Link>{" "}
          register. Worker induction flags appear on the Workers tab.
        </p>
      ) : null}
    </div>
  );
}
