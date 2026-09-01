import Link from "next/link";
import {
  allocateUaucAction,
  assigneeCloseUaucAction,
  finalCloseUaucAction,
} from "@/app/actions/enterprise";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function UaucWorkflowBar({
  eventId,
  status,
  uaucStage,
  typeCode,
  assignees,
  permissions,
}: {
  eventId: string;
  organizationId?: string;
  status: string;
  uaucStage?: string | null;
  typeCode?: string;
  assignees: Array<{ id: string; name: string }>;
  permissions: string[];
}) {
  const isUauc = typeCode === "unsafe_act" || typeCode === "unsafe_condition";
  if (!isUauc || status === "closed" || status === "cancelled") return null;

  const canAllocate = permissions.includes("hazards.allocate");
  const canAssigneeClose = permissions.includes("hazards.close_assigned");
  const canFinalClose = permissions.includes("hazards.final_close");

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">UA/UC workflow</h2>
        <Link href={`/app/incidents/${eventId}`} className="text-xs text-accent hover:underline">
          Open full record
        </Link>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        Stage: {uaucStage ?? status} — allocate → assignee close → final closure (Safety Officer)
      </p>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {canAllocate && ["submitted", "draft", "triage"].includes(status) ? (
          <ActionForm action={allocateUaucAction} className="space-y-2 rounded-xl border border-border p-3">
            <input type="hidden" name="eventId" value={eventId} />
            <p className="text-xs font-medium">1. Allocate</p>
            <Label htmlFor={`assignee-${eventId}`} className="sr-only">
              Assignee
            </Label>
            <select
              id={`assignee-${eventId}`}
              name="assigneeId"
              required
              className="flex h-10 w-full rounded-md border border-border bg-card px-2 text-sm"
            >
              <option value="">Select assignee</option>
              {assignees.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <Input name="note" placeholder="Allocation note" />
            <Button type="submit" size="sm" className="w-full">
              Allocate
            </Button>
          </ActionForm>
        ) : null}
        {canAssigneeClose && ["triage", "capa", "verification"].includes(status) ? (
          <ActionForm action={assigneeCloseUaucAction} className="space-y-2 rounded-xl border border-border p-3">
            <input type="hidden" name="eventId" value={eventId} />
            <p className="text-xs font-medium">2. Assignee close</p>
            <Textarea name="note" placeholder="Corrective action summary" rows={2} />
            <Button type="submit" size="sm" variant="outline" className="w-full">
              Mark assignee closed
            </Button>
          </ActionForm>
        ) : null}
        {canFinalClose && ["approval", "verification", "triage", "capa"].includes(status) ? (
          <ActionForm action={finalCloseUaucAction} className="space-y-2 rounded-xl border border-border p-3">
            <input type="hidden" name="eventId" value={eventId} />
            <p className="text-xs font-medium">3. Final closure</p>
            <Textarea name="note" placeholder="Compliance verification" rows={2} />
            <Button type="submit" size="sm" className="w-full">
              Final close
            </Button>
          </ActionForm>
        ) : null}
      </div>
    </section>
  );
}
