import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIAgentKey, AIScope } from "@/lib/ai/core/types";
import { conversationVisible } from "@/lib/ai/permissions";

export async function createConversation(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    agentKey: AIAgentKey;
    scope: AIScope;
    title?: string;
  },
) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .insert({
      organization_id: input.organizationId,
      user_id: input.userId,
      agent_key: input.agentKey,
      scope: input.scope,
      title: input.title ?? "Copilot",
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function getConversation(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    userId: string;
    conversationId: string;
    permissions: string[];
    isPlatformAdmin: boolean;
  },
) {
  const { data, error } = await supabase
    .from("ai_conversations")
    .select("*")
    .eq("id", input.conversationId)
    .eq("organization_id", input.organizationId)
    .is("deleted_at", null)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;
  const visible = conversationVisible({
    organizationId: data.organization_id,
    userId: data.user_id,
    scope: data.scope,
    viewer: {
      organizationId: input.organizationId,
      userId: input.userId,
      permissions: input.permissions,
      isPlatformAdmin: input.isPlatformAdmin,
    },
  });
  return visible ? data : null;
}

export async function appendMessage(
  supabase: SupabaseClient,
  input: {
    organizationId: string;
    conversationId: string;
    role: "user" | "assistant" | "system" | "tool";
    content: string;
    confidence?: number | null;
    modelTask?: string;
    modelId?: string;
    tokenIn?: number;
    tokenOut?: number;
    latencyMs?: number;
  },
) {
  const { data, error } = await supabase
    .from("ai_messages")
    .insert({
      organization_id: input.organizationId,
      conversation_id: input.conversationId,
      role: input.role,
      content: input.content,
      confidence: input.confidence ?? null,
      model_task: input.modelTask ?? null,
      model_id: input.modelId ?? null,
      token_in: input.tokenIn ?? null,
      token_out: input.tokenOut ?? null,
      latency_ms: input.latencyMs ?? null,
    })
    .select("*")
    .single();
  if (error) throw new Error(error.message);
  return data;
}

export async function saveMessageSources(
  supabase: SupabaseClient,
  organizationId: string,
  messageId: string,
  sources: Array<{
    sourceType: string;
    sourceId?: string | null;
    title: string;
    excerpt?: string | null;
    href?: string | null;
    confidence?: number | null;
    isCurrent?: boolean;
  }>,
) {
  if (!sources.length) return;
  await supabase.from("ai_message_sources").insert(
    sources.map((s) => ({
      organization_id: organizationId,
      message_id: messageId,
      source_type: s.sourceType,
      source_id: s.sourceId ?? null,
      title: s.title,
      excerpt: s.excerpt ?? null,
      href: s.href ?? null,
      confidence: s.confidence ?? null,
      is_current: s.isCurrent ?? true,
    })),
  );
}
