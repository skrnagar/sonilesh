import { createInductionAction, recordInductionAction } from "@/app/actions/contractors";
import { ContractorsNav } from "@/components/contractors/contractors-nav";
import { ActionForm } from "@/components/shared/action-form";
import { RecordsTable } from "@/components/modules/records-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { permissionFlags } from "@/lib/services/rbac";

export default async function ContractorInductionsPage() {
  const access = await requireModuleAccess({
    featureCode: "contractor_management",
    permission: "contractor.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Contractor management" />;
  if (!access.permitted) return <ForbiddenState />;

  const flags = await permissionFlags(access.supabase, access.organization.id, access.user.id);
  const canUpdate = flags.hasAny(["contractor.update", "contractor.manage"]);
  const canManageWorkers = flags.hasAny(["contractor_worker.manage", "contractor.manage"]);

  const orgId = access.organization.id;
  const [{ data: inductions }, { data: sites }, { data: workers }, { data: records }] = await Promise.all([
    access.supabase.from("contractor_inductions").select("id, title, site_id").eq("organization_id", orgId).eq("is_active", true),
    access.supabase.from("sites").select("id, name").eq("organization_id", orgId).is("deleted_at", null),
    access.supabase.from("contractor_workers").select("id, full_name").eq("organization_id", orgId).is("deleted_at", null),
    access.supabase
      .from("contractor_induction_records")
      .select("id, completed_at, expires_on, contractor_workers:worker_id(full_name), contractor_inductions:induction_id(title)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Inductions</h1>
        <p className="text-sm text-muted-foreground">
          Site/project induction records. Training courses stay on the existing training module.
        </p>
      </div>
      <ContractorsNav current="/app/contractors/inductions" />
      <div className="grid gap-4 lg:grid-cols-2">
        {canUpdate ? (
        <ActionForm action={createInductionAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">New induction</p>
          <Label>Title</Label>
          <Input name="title" required />
          <Label>Site</Label>
          <Select name="siteId" defaultValue="">
            <option value="">Any / org-wide</option>
            {(sites ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
          <Label>Validity (days)</Label>
          <Input name="validityDays" type="number" min={0} />
          <Button type="submit">Create</Button>
        </ActionForm>
        ) : null}
        {canManageWorkers ? (
        <ActionForm action={recordInductionAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <p className="text-sm font-semibold">Record completion</p>
          <Label>Induction</Label>
          <Select name="inductionId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {(inductions ?? []).map((i) => (
              <option key={i.id} value={i.id}>
                {i.title}
              </option>
            ))}
          </Select>
          <Label>Worker</Label>
          <Select name="workerId" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {(workers ?? []).map((w) => (
              <option key={w.id} value={w.id}>
                {w.full_name}
              </option>
            ))}
          </Select>
          <Button type="submit">Record</Button>
        </ActionForm>
        ) : null}
      </div>
      <RecordsTable
        columns={["Worker", "Induction", "Completed", "Expires"]}
        empty="No induction records."
        rows={(records ?? []).map((row) => [
          (row.contractor_workers as { full_name?: string } | null)?.full_name ?? "—",
          (row.contractor_inductions as { title?: string } | null)?.title ?? "—",
          row.completed_at?.slice(0, 10) ?? "—",
          row.expires_on ?? "—",
        ])}
      />
    </div>
  );
}
