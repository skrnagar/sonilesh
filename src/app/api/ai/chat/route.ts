import { NextResponse } from "next/server";
import { requireOrgContext } from "@/lib/auth/org-context";
import { buildAiAuthContext } from "@/lib/ai/core/context";
import { canUseAgent } from "@/lib/ai/permissions";
import { runDeterministicCopilot, copilotSystemPrompt } from "@/lib/ai/agents/copilot";
import { isAiConfigured, AI_LOOP_LIMITS } from "@/lib/ai/core/config";
import { loadLanguageModel } from "@/lib/ai/models/router";
import { buildSdkTools } from "@/lib/ai/tools/sdk";
import { createConversation, getConversation, appendMessage, saveMessageSources } from "@/lib/ai/conversations";
import { logAiUsage } from "@/lib/ai/audit";
import type { AIAgentKey, AIScope } from "@/lib/ai/core/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function asAgentKey(value: unknown): AIAgentKey {
  const allowed: AIAgentKey[] = ["copilot", "incident", "risk", "capa", "document", "executive", "field"];
  return allowed.includes(value as AIAgentKey) ? (value as AIAgentKey) : "copilot";
}

function asScope(value: unknown, agentKey: AIAgentKey): AIScope {
  if (agentKey === "field") return "field";
  if (agentKey === "executive") return "executive";
  const allowed: AIScope[] = ["workspace", "field", "executive", "admin"];
  return allowed.includes(value as AIScope) ? (value as AIScope) : "workspace";
}

export async function POST(req: Request) {
  const { supabase, user, organization, siteId, projectId, profile } = await requireOrgContext();
  const body = await req.json().catch(() => ({}));
  const prompt = String(body.prompt ?? body.message ?? "").trim();
  if (!prompt) {
    return NextResponse.json({ error: "Message required" }, { status: 400 });
  }

  const agentKey = asAgentKey(body.agentKey);
  const scope = asScope(body.scope, agentKey);
  const ctx = await buildAiAuthContext({
    supabase,
    user,
    organizationId: organization.id,
    siteId,
    projectId,
    isPlatformAdmin: Boolean(profile?.is_platform_admin),
    agentKey,
    scope,
  });

  if (!canUseAgent(ctx)) {
    return NextResponse.json({ error: "AI Copilot is not enabled for this user." }, { status: 403 });
  }

  let conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  if (conversationId) {
    const existing = await getConversation(supabase, {
      organizationId: organization.id,
      userId: user.id,
      conversationId,
      permissions: ctx.permissions,
      isPlatformAdmin: ctx.isPlatformAdmin,
    });
    if (!existing) conversationId = null;
  }
  if (!conversationId) {
    const created = await createConversation(supabase, {
      organizationId: organization.id,
      userId: user.id,
      agentKey,
      scope,
      title: prompt.slice(0, 80),
    });
    conversationId = created.id;
  }

  await appendMessage(supabase, {
    organizationId: organization.id,
    conversationId,
    role: "user",
    content: prompt,
  });

  const started = Date.now();
  const model = isAiConfigured() ? await loadLanguageModel("CHAT") : null;

  if (!model) {
    const answer = await runDeterministicCopilot({
      supabase,
      ctx,
      prompt,
      conversationId,
    });
    const saved = await appendMessage(supabase, {
      organizationId: organization.id,
      conversationId,
      role: "assistant",
      content: answer.text,
      confidence: answer.confidence,
      modelTask: "CHAT",
      latencyMs: Date.now() - started,
    });
    await saveMessageSources(supabase, organization.id, saved.id, answer.citations);
    return NextResponse.json({
      conversationId,
      configured: false,
      ...answer,
    });
  }

  try {
    const { streamText, convertToModelMessages, stepCountIs } = await import("ai");
    const tools = await buildSdkTools(ctx, supabase, conversationId);
    const uiMessages = Array.isArray(body.messages)
      ? body.messages
      : [{ id: "user", role: "user" as const, parts: [{ type: "text" as const, text: prompt }] }];
    const messages = await convertToModelMessages(uiMessages as never);
    const result = streamText({
      model: model.model,
      system: copilotSystemPrompt(ctx),
      messages,
      tools,
      stopWhen: stepCountIs(AI_LOOP_LIMITS.maxIterations),
      maxOutputTokens: AI_LOOP_LIMITS.tokenBudget,
      abortSignal: AbortSignal.timeout(AI_LOOP_LIMITS.timeoutMs),
    });

    return result.toUIMessageStreamResponse({
      originalMessages: uiMessages as never,
      onFinish: async ({ responseMessage }) => {
        const text = (responseMessage.parts ?? [])
          .map((part) => {
            const rec = part as { type?: string; text?: string };
            return rec.type === "text" ? String(rec.text ?? "") : "";
          })
          .join("\n");
        const saved = await appendMessage(supabase, {
          organizationId: organization.id,
          conversationId: conversationId!,
          role: "assistant",
          content: text || "(streamed)",
          modelTask: "CHAT",
          modelId: model.resolved.modelId,
          latencyMs: Date.now() - started,
        });
        await logAiUsage(supabase, {
          organizationId: organization.id,
          userId: user.id,
          conversationId,
          task: "CHAT",
          modelId: model.resolved.modelId,
          provider: model.resolved.provider,
        });
        void saved;
      },
    });
  } catch (err) {
    const answer = await runDeterministicCopilot({ supabase, ctx, prompt, conversationId });
    answer.text = `Model unavailable. ${answer.text}`;
    const saved = await appendMessage(supabase, {
      organizationId: organization.id,
      conversationId,
      role: "assistant",
      content: answer.text,
      confidence: answer.confidence,
      latencyMs: Date.now() - started,
    });
    await saveMessageSources(supabase, organization.id, saved.id, answer.citations);
    return NextResponse.json({
      conversationId,
      configured: false,
      fallback: true,
      error: err instanceof Error ? err.message : "model_error",
      ...answer,
    });
  }
}
