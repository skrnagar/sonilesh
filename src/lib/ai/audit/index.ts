import type { SupabaseClient } from "@supabase/supabase-js";
import { writeAuditLog } from "@/lib/services/audit";

export async function logAiToolCall(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    conversationId?: string | null;
    messageId?: string | null;
    toolName: string;
    isWrite: boolean;
    status: "ok" | "denied" | "error" | "timeout";
    args: unknown;
    output?: unknown;
    error?: string;
    durationMs?: number;
  },
) {
  await supabase.from("ai_tool_calls").insert({
    organization_id: input.organizationId,
    conversation_id: input.conversationId ?? null,
    message_id: input.messageId ?? null,
    tool_name: input.toolName,
    is_write: input.isWrite,
    status: input.status,
    input: input.args ?? {},
    output: input.output ?? null,
    error_text: input.error ?? null,
    duration_ms: input.durationMs ?? null,
    created_by: input.userId,
  });
}

export async function logAiUsage(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    conversationId?: string | null;
    task?: string;
    modelId?: string;
    provider?: string;
    tokenIn?: number;
    tokenOut?: number;
  },
) {
  await supabase.from("ai_usage_events").insert({
    organization_id: input.organizationId,
    user_id: input.userId,
    conversation_id: input.conversationId ?? null,
    task: input.task ?? null,
    model_id: input.modelId ?? null,
    provider: input.provider ?? null,
    token_in: input.tokenIn ?? 0,
    token_out: input.tokenOut ?? 0,
  });
}

export async function auditAiEvent(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  },
) {
  await writeAuditLog(supabase, {
    organizationId: input.organizationId,
    actorUserId: input.userId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: input.metadata,
  });
}
