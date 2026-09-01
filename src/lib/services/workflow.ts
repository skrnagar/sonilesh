import type { SupabaseClient } from "@supabase/supabase-js";
import type { EhsEventStatus } from "@/types/database";
import { canTransition } from "@/lib/services/events";

/**
 * Workflow interface for the reporting engine.
 * Module profiles (UA/UC, incident, permit) layer on top of generic event transitions.
 */
export type WorkflowContext = {
  organizationId: string;
  reportId: string;
  userId: string;
  currentStatus: EhsEventStatus;
};

export type WorkflowModule = "generic" | "uauc";

export async function startWorkflow(
  _supabase: SupabaseClient,
  ctx: WorkflowContext & { initialStatus?: EhsEventStatus; module?: WorkflowModule },
) {
  return {
    started: true,
    status: ctx.initialStatus ?? ctx.currentStatus,
    engine: "reporting_builtin_v1" as const,
    module: ctx.module ?? "generic",
  };
}

export function workflowCanTransition(from: EhsEventStatus, to: EhsEventStatus) {
  return canTransition(from, to);
}

export async function workflowTransition(
  supabase: SupabaseClient,
  ctx: WorkflowContext & { nextStatus: EhsEventStatus; note?: string },
) {
  const { transitionEhsEvent } = await import("@/lib/services/events");
  if (!workflowCanTransition(ctx.currentStatus, ctx.nextStatus)) {
    throw new Error(`Workflow cannot transition ${ctx.currentStatus} → ${ctx.nextStatus}`);
  }
  return transitionEhsEvent(supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    eventId: ctx.reportId,
    toStatus: ctx.nextStatus,
    note: ctx.note,
  });
}

// ---------------------------------------------------------------------------
// UA/UC workflow profile (Phase 21)
// Spec: CREATE → SUBMITTED → EHS TRIAGE → ASSIGNED → ACTION IN PROGRESS
//       → ACTION COMPLETED → VERIFICATION → CLOSED
// ---------------------------------------------------------------------------

export type UaucWorkflowStepKey =
  | "create"
  | "submitted"
  | "ehs_triage"
  | "assigned"
  | "action_in_progress"
  | "action_completed"
  | "verification"
  | "closed";

export const UAUC_WORKFLOW_STEPS: Array<{
  key: UaucWorkflowStepKey;
  label: string;
}> = [
  { key: "create", label: "Create" },
  { key: "submitted", label: "Submitted" },
  { key: "ehs_triage", label: "EHS Triage" },
  { key: "assigned", label: "Assigned" },
  { key: "action_in_progress", label: "Action in Progress" },
  { key: "action_completed", label: "Action Completed" },
  { key: "verification", label: "Verification" },
  { key: "closed", label: "Closed" },
];

export type UaucWorkflowContext = {
  status: EhsEventStatus;
  uaucStage?: string | null;
  assignedTo?: string | null;
};

export function resolveUaucWorkflowStep(ctx: UaucWorkflowContext): UaucWorkflowStepKey {
  const { status, uaucStage, assignedTo } = ctx;

  if (status === "cancelled" || status === "closed") return "closed";
  if (status === "draft") return "create";
  if (status === "submitted") return "submitted";
  if (status === "verification") return "verification";
  if (uaucStage === "assignee_closed" || status === "approval") return "action_completed";
  if (uaucStage === "action_in_progress" || status === "capa") return "action_in_progress";
  if (uaucStage === "allocated" || assignedTo) return "assigned";
  if (status === "triage") return "ehs_triage";

  return "ehs_triage";
}

export function getUaucStepIndex(step: UaucWorkflowStepKey): number {
  return UAUC_WORKFLOW_STEPS.findIndex((s) => s.key === step);
}

export type UaucWorkflowAction =
  | "allocate"
  | "start_action"
  | "assignee_close"
  | "final_close";

export function getAvailableUaucActions(
  ctx: UaucWorkflowContext,
  permissions: string[],
): UaucWorkflowAction[] {
  const step = resolveUaucWorkflowStep(ctx);
  const actions: UaucWorkflowAction[] = [];

  if (
    permissions.includes("hazards.allocate") &&
    (step === "submitted" || step === "ehs_triage")
  ) {
    actions.push("allocate");
  }
  if (permissions.includes("hazards.close_assigned") && step === "assigned") {
    actions.push("start_action");
  }
  if (
    permissions.includes("hazards.close_assigned") &&
    step === "action_in_progress"
  ) {
    actions.push("assignee_close");
  }
  if (
    permissions.includes("hazards.final_close") &&
    (step === "action_completed" || step === "verification")
  ) {
    actions.push("final_close");
  }

  return actions;
}
