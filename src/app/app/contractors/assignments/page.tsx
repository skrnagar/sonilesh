import {
  approveProjectAssignmentAction,
  approveSiteAssignmentAction,
  approveWorkerAssignmentAction,
  requestProjectAssignmentAction,
  requestSiteAssignmentAction,
} from "@/app/actions/contractors";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { ActionForm } from "@/components/shared/action-form";
import { RecordsTable, StatusPill } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listContractorCompanies } from "@/lib/services/contractors";

export default async function ContractorAssignmentsPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor_access.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const orgId = access.organization.id;
  const [companies, { data: sites }, { data: projects }, { data: siteRows }, { data: projectRows }, { data: workerRows }] =
    await Promise.all([
      listContractorCompanies(access.supabase, orgId),
      access.supabase.from("sites").select("id, name").eq("organization_id", orgId).is("deleted_at", null),
      access.supabase.from("projects").select("id, name").eq("organization_id", orgId).is("deleted_at", null),
      access.supabase
        .from("contractor_site_assignments")
        .select("id, status, requested_by, company_id, sites:site_id(name), contractor_companies:company_id(name)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
      access.supabase
        .from("contractor_project_assignments")
        .select("id, status, requested_by, projects:project_id(name), contractor_companies:company_id(name)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
      access.supabase
        .from("contractor_worker_assignments")
        .select("id, status, contractor_workers:worker_id(full_name), sites:site_id(name)")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false }),
    ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Site & project assignments</h1>
        <p className="text-sm text-muted-foreground">
          Access is explicit. Approval at one site does not grant another. Requesters cannot
          self-approve.
        </p>
      </div>
      <ContractorsNav current="/app/contractors/assignments" />

      <div className="grid gap-4 lg:grid-cols-2">
        <ActionForm action={requestSiteAssignmentAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Request site access</p>
          <Label>Company</Label>
          <Select name="companyId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Label>Site</Label>
          <Select name="siteId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Button type="submit">Request</Button>
        </ActionForm>
        <ActionForm action={requestProjectAssignmentAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Request project access</p>
          <Label>Company</Label>
          <Select name="companyId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
          <Label>Project</Label>
          <Select name="projectId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {(projects ?? []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </Select>
          <Button type="submit">Request</Button>
        </ActionForm>
      </div>

      <RecordsTable
        columns={["Company", "Site", "Status", "Decide"]}
        empty="No site assignments."
        rows={(siteRows ?? []).map((row) => [
          (row.contractor_companies as { name?: string } | null)?.name ?? "—",
          (row.sites as { name?: string } | null)?.name ?? "—",
          <StatusPill key="s" value={row.status} />,
          row.status === "requested" ? (
            <ActionForm key={row.id} action={approveSiteAssignmentAction} className="flex gap-2">
              <input type="hidden" name="assignmentId" value={row.id} />
              <input type="hidden" name="companyId" value={row.company_id} />
              <Button type="submit" name="decision" value="approved" size="sm">
                Approve
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

      <RecordsTable
        columns={["Company", "Project", "Status", "Decide"]}
        empty="No project assignments."
        rows={(projectRows ?? []).map((row) => [
          (row.contractor_companies as { name?: string } | null)?.name ?? "—",
          (row.projects as { name?: string } | null)?.name ?? "—",
          <StatusPill key="s" value={row.status} />,
          row.status === "requested" ? (
            <ActionForm key={row.id} action={approveProjectAssignmentAction} className="flex gap-2">
              <input type="hidden" name="assignmentId" value={row.id} />
              <Button type="submit" name="decision" value="approved" size="sm">
                Approve
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

      <RecordsTable
        columns={["Worker", "Site", "Status", "Decide"]}
        empty="No worker assignments."
        rows={(workerRows ?? []).map((row) => [
          (row.contractor_workers as { full_name?: string } | null)?.full_name ?? "—",
          (row.sites as { name?: string } | null)?.name ?? "—",
          <StatusPill key="s" value={row.status} />,
          row.status === "requested" ? (
            <ActionForm key={row.id} action={approveWorkerAssignmentAction} className="flex gap-2">
              <input type="hidden" name="assignmentId" value={row.id} />
              <Button type="submit" name="decision" value="approved" size="sm">
                Approve
              </Button>
            </ActionForm>
          ) : (
            "—"
          ),
        ])}
      />
    </div>
  );
}
