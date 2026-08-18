import type { SupabaseClient } from "@supabase/supabase-js";
import type { AIAuthContext } from "@/lib/ai/permissions";
import { allowedToolNames, bindToolOrganization, toolAllowed } from "@/lib/ai/permissions";
import { isForbiddenToolName, validateToolArgs } from "@/lib/ai/guardrails";
import { logAiToolCall } from "@/lib/ai/audit";
import type { AIToolResult } from "@/lib/ai/core/types";
import { WRITE_TOOL_NAMES } from "@/lib/ai/core/types";
import { AI_LOOP_LIMITS } from "@/lib/ai/core/config";
import * as read from "@/lib/ai/tools/read";
import { createDraftSuggestion } from "@/lib/ai/tools/write";

export type ToolExecutor = (
  supabase: SupabaseClient,
  ctx: AIAuthContext,
  args: Record<string, unknown>,
) => Promise<AIToolResult>;

const READ_EXECUTORS: Record<string, ToolExecutor> = {
  query_incidents: (s, c, a) => read.queryIncidents(s, c, a),
  get_incident: (s, c, a) => read.getIncident(s, c, { incidentId: String(a.incidentId ?? a.id ?? "") }),
  query_risks: (s, c, a) => read.queryRisks(s, c, a),
  query_permits: (s, c, a) =>
    read.queryPermitsTool(s, c, { status: a.status as string | undefined, activeBoard: Boolean(a.activeBoard) }),
  query_inspections: (s, c, a) => read.queryInspections(s, c, a),
  query_audits: (s, c) => read.queryAudits(s, c),
  query_findings: (s, c, a) => read.queryFindings(s, c, a),
  query_capa: (s, c, a) => read.queryCapa(s, c, a),
  query_training: (s, c) => read.queryTraining(s, c),
  query_certifications: (s, c) => read.queryCertifications(s, c),
  query_contractors: (s, c, a) => read.queryContractors(s, c, a),
  query_compliance: (s, c) => read.queryCompliance(s, c),
  query_documents: (s, c, a) => read.queryDocuments(s, c, a),
  query_sds: (s, c, a) => read.querySds(s, c, a),
  query_ppe: (s, c) => read.queryPpe(s, c),
  query_moc: (s, c, a) => read.queryMoc(s, c, a),
  analytics_query: (s, c) => read.analyticsQuery(s, c),
  search_knowledge: (s, c, a) => read.searchKnowledgeTool(s, c, a),
};

export async function executeAiTool(input: {
  supabase: SupabaseClient;
  ctx: AIAuthContext;
  toolName: string;
  args: unknown;
  conversationId?: string | null;
  callIndex: number;
}): Promise<AIToolResult> {
  const started = Date.now();
  if (input.callIndex >= AI_LOOP_LIMITS.maxToolCalls) {
    return { ok: false, tool: input.toolName, error: "Tool-call budget exhausted for this turn." };
  }
  if (isForbiddenToolName(input.toolName)) {
    await logAiToolCall(input.supabase, {
      organizationId: input.ctx.organizationId,
      userId: input.ctx.userId,
      conversationId: input.conversationId,
      toolName: input.toolName,
      isWrite: true,
      status: "denied",
      args: {},
      error: "Forbidden autonomous action",
      durationMs: Date.now() - started,
    });
    return { ok: false, tool: input.toolName, denied: true, error: "AI cannot perform that action." };
  }

  const gate = toolAllowed(input.ctx, input.toolName);
  if (!gate.allowed) {
    await logAiToolCall(input.supabase, {
      organizationId: input.ctx.organizationId,
      userId: input.ctx.userId,
      conversationId: input.conversationId,
      toolName: input.toolName,
      isWrite: false,
      status: "denied",
      args: {},
      error: gate.reason,
      durationMs: Date.now() - started,
    });
    return { ok: false, tool: input.toolName, denied: true, error: gate.reason };
  }

  const parsed = validateToolArgs(input.args);
  if (!parsed.ok) return { ok: false, tool: input.toolName, error: parsed.error };
  const bound = bindToolOrganization(input.ctx, parsed.args);

  try {
    let result: AIToolResult;
    if ((WRITE_TOOL_NAMES as readonly string[]).includes(input.toolName)) {
      result = await createDraftSuggestion(input.supabase, input.ctx, {
        type: input.toolName as (typeof WRITE_TOOL_NAMES)[number],
        title: String(bound.title ?? "AI draft"),
        payload: bound,
        sourceModule: bound.sourceModule ? String(bound.sourceModule) : undefined,
        sourceRecordId: bound.sourceRecordId ? String(bound.sourceRecordId) : undefined,
        conversationId: input.conversationId,
      });
    } else {
      const exec = READ_EXECUTORS[input.toolName];
      if (!exec) return { ok: false, tool: input.toolName, error: "Unknown tool." };
      result = await exec(input.supabase, input.ctx, bound);
    }

    await logAiToolCall(input.supabase, {
      organizationId: input.ctx.organizationId,
      userId: input.ctx.userId,
      conversationId: input.conversationId,
      toolName: input.toolName,
      isWrite: (WRITE_TOOL_NAMES as readonly string[]).includes(input.toolName),
      status: result.ok ? "ok" : "error",
      args: bound,
      output: result.data ?? null,
      error: result.error,
      durationMs: Date.now() - started,
    });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Tool failed";
    await logAiToolCall(input.supabase, {
      organizationId: input.ctx.organizationId,
      userId: input.ctx.userId,
      conversationId: input.conversationId,
      toolName: input.toolName,
      isWrite: false,
      status: "error",
      args: bound,
      error: message,
      durationMs: Date.now() - started,
    });
    return { ok: false, tool: input.toolName, error: message };
  }
}

export function toolsAvailableToModel(ctx: AIAuthContext) {
  return allowedToolNames(ctx);
}
