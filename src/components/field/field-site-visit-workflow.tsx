"use client";

import { useRouter } from "next/navigation";
import { transitionFieldSiteVisitAction } from "@/app/actions/field";
import {
  fieldControlClass,
  fieldPrimaryBtnClass,
  FieldCard,
  FieldError,
} from "@/components/field/field-ui";
import type { VisitStatus } from "@/lib/site-visits/workflow";
import { SITE_VISIT_TRANSITIONS } from "@/lib/site-visits/workflow";
import { useState } from "react";

export function FieldSiteVisitWorkflow({
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
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canAllocate = permissions.includes("visits.allocate");
  const canFinalClose = permissions.includes("visits.final_close");

  const nextActions: Array<{
    label: string;
    toStatus: VisitStatus;
    needsAssignee?: boolean;
  }> = [];

  if (status === "submitted" && canAllocate && SITE_VISIT_TRANSITIONS.submitted.includes("allocated")) {
    nextActions.push({ label: "Allocate", toStatus: "allocated", needsAssignee: true });
  }
  if (status === "allocated" && canAllocate && SITE_VISIT_TRANSITIONS.allocated.includes("closed")) {
    nextActions.push({ label: "Close visit", toStatus: "closed" });
  }
  if (status === "closed" && canFinalClose && SITE_VISIT_TRANSITIONS.closed.includes("final_closed")) {
    nextActions.push({ label: "Final closure", toStatus: "final_closed" });
  }

  if (!nextActions.length) return null;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>, toStatus: VisitStatus) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("visitId", visitId);
    formData.set("toStatus", toStatus);
    setPending(true);
    setError(null);
    const result = await transitionFieldSiteVisitAction(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error || "Workflow action failed");
      return;
    }
    if (result.href) router.push(result.href);
    router.refresh();
  }

  return (
    <FieldCard className="space-y-3">
      <p className="text-sm font-semibold text-foreground">Workflow</p>
      <p className="text-xs capitalize text-muted-foreground">
        Status: {status.replaceAll("_", " ")}
      </p>
      {nextActions.map((action) => (
        <form
          key={action.toStatus}
          onSubmit={(e) => onSubmit(e, action.toStatus)}
          className="space-y-2 border-t border-border pt-3 first:border-0 first:pt-0"
        >
          {action.needsAssignee ? (
            <label className="block space-y-1">
              <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                Assign to
              </span>
              <select name="assignedTo" required className={fieldControlClass}>
                <option value="">Select person</option>
                {assignees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <label className="block space-y-1">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Notes (optional)
            </span>
            <textarea name="note" rows={2} className={fieldControlClass} />
          </label>
          <button type="submit" disabled={pending} className={fieldPrimaryBtnClass}>
            {pending ? "Saving…" : action.label}
          </button>
        </form>
      ))}
      {error ? <FieldError text={error} /> : null}
    </FieldCard>
  );
}
