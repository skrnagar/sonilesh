import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIAuthContext } from "@/lib/ai/permissions";
import { canUseAgent } from "@/lib/ai/permissions";
import { classifyQuery } from "@/lib/ai/retrieval/classify";
import { executeAiTool } from "@/lib/ai/tools/execute";
import { citationConfidence, dedupeCitations, insufficientEvidenceText } from "@/lib/ai/citations";
import { detectInjectionAttempt, sanitizeUserPrompt, softenClaims } from "@/lib/ai/guardrails";
import { checkRateLimit } from "@/lib/ai/guardrails/rate-limit";
import { isAiConfigured } from "@/lib/ai/core/config";
import type { DeterministicAnswer } from "@/lib/ai/core/types";
import { tAi } from "@/lib/ai/prompts/system";
import { agentDefinition } from "@/lib/ai/agents";

export async function runDeterministicCopilot(input: {
  supabase: SupabaseClient;
  ctx: AIAuthContext;
  prompt: string;
  conversationId?: string | null;
}): Promise<DeterministicAnswer> {
  if (!canUseAgent(input.ctx)) {
    return {
      mode: "unavailable",
      text: "You do not have access to EHS Copilot for this organization.",
      confidence: null,
      citations: [],
      toolResults: [],
      suggestionsCreated: [],
    };
  }

  const rate = checkRateLimit({ organizationId: input.ctx.organizationId, userId: input.ctx.userId });
  if (!rate.allowed) {
    return {
      mode: "unavailable",
      text: rate.reason,
      confidence: null,
      citations: [],
      toolResults: [],
      suggestionsCreated: [],
    };
  }

  const prompt = sanitizeUserPrompt(input.prompt);
  if (detectInjectionAttempt(prompt)) {
    return {
      mode: "deterministic",
      text: "I will not follow instructions that try to override Copilot safety rules. Ask an EHS question about this organization.",
      confidence: 0.9,
      citations: [],
      toolResults: [],
      suggestionsCreated: [],
    };
  }

  const classified = classifyQuery(prompt);
  if (classified.class === "forbidden_cross_tenant") {
    return {
      mode: "deterministic",
      text: tAi("ai.cross_tenant"),
      confidence: 1,
      citations: [],
      toolResults: [],
      suggestionsCreated: [],
    };
  }

  const toolResults = [];
  let callIndex = 0;
  for (const tool of classified.tools.slice(0, 4)) {
    const result = await executeAiTool({
      supabase: input.supabase,
      ctx: input.ctx,
      toolName: tool,
      args: { query: prompt, title: prompt.slice(0, 80) },
      conversationId: input.conversationId,
      callIndex: callIndex++,
    });
    toolResults.push(result);
  }

  const citations = dedupeCitations(toolResults.flatMap((r) => r.citations ?? []));
  const suggestionsCreated = toolResults
    .filter((r) => r.ok && r.data && typeof r.data === "object" && "suggestionId" in (r.data as object))
    .map((r) => {
      const data = r.data as { suggestionId: string; title: string };
      return { id: data.suggestionId, type: r.tool, title: data.title };
    });

  const denied = toolResults.filter((r) => r.denied);
  const empty = toolResults.every((r) => r.insufficientEvidence || !r.ok);

  let text: string;
  if (denied.length && denied.length === toolResults.length) {
    text = denied[0]?.error ?? "Not authorized.";
  } else if (suggestionsCreated.length) {
    text = `${tAi("ai.draft_pending")} ${suggestionsCreated.map((s) => s.title).join("; ")}`;
  } else if (empty) {
    text = insufficientEvidenceText();
  } else {
    const lines = toolResults
      .filter((r) => r.ok)
      .map((r) => {
        const rows = Array.isArray(r.data)
          ? r.data
          : r.data && typeof r.data === "object" && "kpis" in (r.data as object)
            ? (r.data as { kpis: unknown[] }).kpis
            : r.data
              ? [r.data]
              : [];
        return `${r.tool}: ${rows.length} record(s).`;
      });
    text = softenClaims(
      `Results from ${input.ctx.organizationId ? "your organization" : "this workspace"} only.\n${lines.join("\n")}`,
    );
    if (!isAiConfigured()) {
      text = `${tAi("ai.unavailable")}\n\n${text}`;
    }
  }

  return {
    mode: isAiConfigured() ? "deterministic" : "deterministic",
    text,
    confidence: citationConfidence(citations),
    citations,
    toolResults,
    suggestionsCreated,
  };
}

export function copilotSystemPrompt(ctx: AIAuthContext) {
  return agentDefinition(ctx.agentKey).system;
}
