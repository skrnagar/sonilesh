import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIAuthContext } from "@/lib/ai/permissions";
import type { AIToolResult, WriteToolName } from "@/lib/ai/core/types";
import { auditAiEvent } from "@/lib/ai/audit";

function pending(tool: WriteToolName, id: string, title: string): AIToolResult {
  return {
    ok: true,
    tool,
    data: {
      suggestionId: id,
      status: "pending",
      aiGenerated: true,
      requiresHumanApproval: true,
      title,
    },
  };
}

export async function createDraftSuggestion(
  supabase: SupabaseClient,
  ctx: AIAuthContext,
  input: {
    type: WriteToolName;
    title: string;
    payload: Record<string, unknown>;
    sourceModule?: string;
    sourceRecordId?: string;
    conversationId?: string | null;
  },
): Promise<AIToolResult> {
  const { data, error } = await supabase
    .from("ai_suggestions")
    .insert({
      organization_id: ctx.organizationId,
      conversation_id: input.conversationId ?? null,
      suggestion_type: input.type,
      status: "pending",
      title: input.title.slice(0, 200),
      payload: input.payload,
      ai_generated: true,
      source_module: input.sourceModule ?? null,
      source_record_id: input.sourceRecordId ?? null,
      created_by: ctx.userId,
    })
    .select("id, title, status")
    .single();
  if (error) return { ok: false, tool: input.type, error: error.message };

  await auditAiEvent(supabase, {
    organizationId: ctx.organizationId,
    userId: ctx.userId,
    action: "ai.suggestion.drafted",
    entityType: "ai_suggestion",
    entityId: data.id,
    metadata: { type: input.type },
  });

  return pending(input.type, data.id, data.title);
}
