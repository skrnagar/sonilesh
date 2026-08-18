import type { AIAuthContext } from "@/lib/ai/permissions";
import { allowedToolNames } from "@/lib/ai/permissions";
import { executeAiTool } from "@/lib/ai/tools/execute";
import { AI_LOOP_LIMITS } from "@/lib/ai/core/config";

/** AI SDK tools bound to the server auth context — model cannot pick org/user. */
export async function buildSdkTools(
  ctx: AIAuthContext,
  supabase: import("@supabase/supabase-js").SupabaseClient,
  conversationId?: string | null,
) {
  const { tool } = await import("ai");
  const { z } = await import("zod");
  const names = allowedToolNames(ctx);
  const tools: Record<string, unknown> = {};
  let callIndex = 0;

  const str = z.string().max(400).optional();

  for (const name of names) {
    tools[name] = tool({
      description: `EHS tool ${name}. Organization and user are bound server-side.`,
      inputSchema: z.object({
        query: str,
        status: str,
        title: str,
        description: str,
        incidentId: str,
        sourceModule: str,
        sourceRecordId: str,
        priority: str,
        dueDate: str,
        summary: str,
        activeBoard: z.boolean().optional(),
      }),
      execute: async (args: Record<string, unknown>) => {
        const idx = callIndex++;
        if (idx >= AI_LOOP_LIMITS.maxToolCalls) {
          return { ok: false, error: "Tool-call budget exhausted." };
        }
        return executeAiTool({
          supabase,
          ctx,
          toolName: name,
          args,
          conversationId,
          callIndex: idx,
        });
      },
    });
  }
  return tools as unknown as import("ai").ToolSet;
}
