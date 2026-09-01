"use client";

import { transitionSiteVisitAction } from "@/app/actions/enterprise";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { VisitStatus } from "@/lib/site-visits/workflow";
import { SITE_VISIT_TRANSITIONS } from "@/lib/site-visits/workflow";

export function SiteVisitWorkflowBar({
  visitId,
  status,
  permissions,
  assignees,
}: {
  visitId: string;
  status: VisitStatus;
  permissions: string[];
  assignees: Array<{ id: string; name: string }>;
}) {
  const canAllocate = permissions.includes("visits.allocate");
  const canFinalClose = permissions.includes("visits.final_close");

  const nextActions: Array<{
    label: string;
    toStatus: VisitStatus;
    permission: boolean;
    needsAssignee?: boolean;
  }> = [];

  if (status === "submitted" && canAllocate && SITE_VISIT_TRANSITIONS.submitted.includes("allocated")) {
    nextActions.push({ label: "Allocate", toStatus: "allocated", permission: true, needsAssignee: true });
  }
  if (status === "allocated" && canAllocate && SITE_VISIT_TRANSITIONS.allocated.includes("closed")) {
    nextActions.push({ label: "Close visit", toStatus: "closed", permission: true });
  }
  if (status === "closed" && canFinalClose && SITE_VISIT_TRANSITIONS.closed.includes("final_closed")) {
    nextActions.push({ label: "Final closure", toStatus: "final_closed", permission: true });
  }

  if (!nextActions.length) return null;

  return (
    <ActionForm action={transitionSiteVisitAction} className="rounded-xl border border-border bg-muted/30 p-4">
      <input type="hidden" name="visitId" value={visitId} />
      <p className="text-sm font-semibold">Workflow actions</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Current status: <span className="font-medium uppercase">{status.replace("_", " ")}</span>
      </p>
      {nextActions.map((action) => (
        <div key={action.toStatus} className="mt-3 space-y-2 border-t border-border pt-3 first:mt-2 first:border-0 first:pt-0">
          <input type="hidden" name="toStatus" value={action.toStatus} />
          {action.needsAssignee ? (
            <div className="space-y-1">
              <Label htmlFor={`assignee-${visitId}`}>Assign to</Label>
              <select
                id={`assignee-${visitId}`}
                name="assignedTo"
                required
                className="flex h-10 w-full rounded-md border border-border bg-card px-2 text-sm"
              >
                <option value="">Select person</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}
          <div className="space-y-1">
            <Label htmlFor={`note-${action.toStatus}`}>Notes (optional)</Label>
            <Textarea id={`note-${action.toStatus}`} name="note" rows={2} />
          </div>
          <Button type="submit" name="workflowAction" value={action.toStatus}>
            {action.label}
          </Button>
        </div>
      ))}
    </ActionForm>
  );
}
