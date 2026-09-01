import Link from "next/link";
import {
  allocateUaucAction,
  assigneeCloseUaucAction,
  beginUaucActionAction,
  finalCloseUaucAction,
} from "@/app/actions/enterprise";
import { UaucWorkflowSteps } from "@/components/events/uauc-workflow-steps";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { EhsEventStatus } from "@/types/database";
import {
  getAvailableUaucActions,
  resolveUaucWorkflowStep,
} from "@/lib/services/workflow";

export function UaucWorkflowBar({
  eventId,
  status,
  uaucStage,
  typeCode,
  assignedTo,
  assignees,
  permissions,
}: {
  eventId: string;
  organizationId?: string;
  status: string;
  uaucStage?: string | null;
  typeCode?: string;
  assignedTo?: string | null;
  assignees: Array<{ id: string; name: string }>;
  permissions: string[];
}) {
  const isUauc = typeCode === "unsafe_act" || typeCode === "unsafe_condition";
  if (!isUauc || status === "closed" || status === "cancelled") return null;

  const ctx = {
    status: status as EhsEventStatus,
    uaucStage,
    assignedTo,
  };
  const step = resolveUaucWorkflowStep(ctx);
  const actions = getAvailableUaucActions(ctx, permissions);

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">UA/UC workflow</h2>
        <Link href={`/app/incidents/${eventId}`} className="text-xs text-accent hover:underline">
          Open full record
        </Link>
      </div>
      <UaucWorkflowSteps
        status={ctx.status}
        uaucStage={uaucStage}
        assignedTo={assignedTo}
        className="mt-3"
      />
      <p className="mt-2 text-xs text-muted-foreground">
        Current step: <span className="font-medium text-foreground">{step.replace(/_/g, " ")}</span>
      </p>
      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        {actions.includes("allocate") ? (
          <ActionForm action={allocateUaucAction} className="space-y-2 rounded-xl border border-border p-3">
            <input type="hidden" name="eventId" value={eventId} />
            <p className="text-xs font-medium">Allocate to assignee</p>
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
        {actions.includes("start_action") ? (
          <ActionForm action={beginUaucActionAction} className="space-y-2 rounded-xl border border-border p-3">
            <input type="hidden" name="eventId" value={eventId} />
            <p className="text-xs font-medium">Start corrective action</p>
            <Input name="note" placeholder="Action plan (optional)" />
            <Button type="submit" size="sm" variant="outline" className="w-full">
              Mark action in progress
            </Button>
          </ActionForm>
        ) : null}
        {actions.includes("assignee_close") ? (
          <ActionForm action={assigneeCloseUaucAction} className="space-y-2 rounded-xl border border-border p-3">
            <input type="hidden" name="eventId" value={eventId} />
            <p className="text-xs font-medium">Complete corrective action</p>
            <Textarea name="note" placeholder="Corrective action summary" rows={2} required />
            <Button type="submit" size="sm" variant="outline" className="w-full">
              Mark action completed
            </Button>
          </ActionForm>
        ) : null}
        {actions.includes("final_close") ? (
          <ActionForm action={finalCloseUaucAction} className="space-y-2 rounded-xl border border-border p-3">
            <input type="hidden" name="eventId" value={eventId} />
            <p className="text-xs font-medium">Verification &amp; final closure</p>
            <Textarea name="note" placeholder="Compliance verification notes" rows={2} required />
            <Button type="submit" size="sm" className="w-full">
              Verify and close
            </Button>
          </ActionForm>
        ) : null}
      </div>
    </section>
  );
}
