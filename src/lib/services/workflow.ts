import type { SupabaseClient } from "@supabase/supabase-js";
import type { EhsEventStatus } from "@/types/database";
import { canTransition } from "@/lib/services/events";

/**
 * Workflow interface for the reporting engine.
 * Full workflow engine lands in a later phase — these are stable call sites.
 */
export type WorkflowContext = {
  organizationId: string;
  reportId: string;
  userId: string;
  currentStatus: EhsEventStatus;
};

export async function startWorkflow(
  _supabase: SupabaseClient,
  ctx: WorkflowContext & { initialStatus?: EhsEventStatus },
) {
  return {
    started: true,
    status: ctx.initialStatus ?? ctx.currentStatus,
    engine: "reporting_builtin_v1" as const,
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
