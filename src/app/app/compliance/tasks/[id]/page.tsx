import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { fileComplianceTaskAction, verifyComplianceTaskAction } from "@/app/actions/compliance";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { notFound } from "next/navigation";

export default async function ComplianceTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const access = await requireModuleAccess({
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Regulatory compliance" />;
  if (!access.permitted) return <ForbiddenState />;

  const { id } = await params;
  const { data: task } = await access.supabase
    .from("compliance_task_instances")
    .select(
      `
      id, period_label, due_date, status, filed_date, filed_by, verified_by, notes,
      org_applicable_compliances (
        owner_id,
        compliance_obligations (
          title, description, issuing_authority, penalty_description, penalty_amount_note, source_reference, frequency
        )
      )
    `,
    )
    .eq("id", id)
    .eq("organization_id", access.organization.id)
    .maybeSingle();

  if (!task) notFound();

  const obligation = (
    task.org_applicable_compliances as {
      compliance_obligations?: {
        title?: string;
        description?: string;
        issuing_authority?: string;
        penalty_description?: string;
        penalty_amount_note?: string;
        source_reference?: string;
        frequency?: string;
      } | null;
    } | null
  )?.compliance_obligations;

  const { data: evidence } = await access.supabase
    .from("compliance_evidence")
    .select("id, file_name, storage_path, uploaded_at")
    .eq("task_instance_id", id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{obligation?.title}</h1>
        <p className="text-sm text-muted-foreground">
          {obligation?.issuing_authority} · {task.period_label} · due {task.due_date} · {task.status}
        </p>
      </div>
      <p className="text-sm">{obligation?.description}</p>
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-red-800">Penalty if missed</p>
        <p className="mt-1 text-sm text-red-950">{obligation?.penalty_description || "Not specified in library."}</p>
        {obligation?.penalty_amount_note ? (
          <p className="mt-1 text-xs text-red-800">{obligation.penalty_amount_note}</p>
        ) : null}
        {obligation?.source_reference ? (
          <p className="mt-2 text-xs text-muted-foreground">Source: {obligation.source_reference}</p>
        ) : null}
      </div>
      <div>
        <h2 className="text-sm font-semibold">Evidence</h2>
        <ul className="mt-2 list-disc pl-5 text-sm">
          {(evidence ?? []).map((row) => (
            <li key={row.id}>
              {row.file_name} — {row.storage_path}
            </li>
          ))}
        </ul>
      </div>
      {task.status !== "verified" ? (
        <ActionForm action={fileComplianceTaskAction} className="max-w-lg space-y-3 rounded-2xl border border-border bg-card p-4">
          <input type="hidden" name="taskId" value={task.id} />
          <Input name="evidenceUrl" placeholder="Evidence file URL or storage path" />
          <Input name="notes" placeholder="Filing notes" defaultValue={task.notes ?? ""} />
          <Button type="submit">Mark as filed</Button>
        </ActionForm>
      ) : null}
      {task.status === "filed" ? (
        <ActionForm action={verifyComplianceTaskAction}>
          <input type="hidden" name="taskId" value={task.id} />
          <Button type="submit" variant="outline">
            Verify filing (cannot be the filer)
          </Button>
        </ActionForm>
      ) : null}
    </div>
  );
}
