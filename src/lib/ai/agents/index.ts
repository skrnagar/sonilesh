import type { AIAgentKey } from "@/lib/ai/core/types";
import { AI_LOOP_LIMITS } from "@/lib/ai/core/config";
import { systemForAgent } from "@/lib/ai/prompts/system";

export type AgentDefinition = {
  key: AIAgentKey;
  title: string;
  description: string;
  system: string;
  maxIterations: number;
  maxToolCalls: number;
  timeoutMs: number;
  tokenBudget: number;
};

export function agentDefinition(key: AIAgentKey): AgentDefinition {
  return {
    key,
    title:
      key === "executive"
        ? "Executive Copilot"
        : key === "field"
          ? "Field Copilot"
          : "EHS Copilot",
    description: "Calls existing EHS engines through authorized tools. Drafts never auto-apply.",
    system: systemForAgent(key),
    maxIterations: AI_LOOP_LIMITS.maxIterations,
    maxToolCalls: AI_LOOP_LIMITS.maxToolCalls,
    timeoutMs: AI_LOOP_LIMITS.timeoutMs,
    tokenBudget: AI_LOOP_LIMITS.tokenBudget,
  };
}
