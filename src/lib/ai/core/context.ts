import type { SupabaseClient } from "@supabase/supabase-js";
import type { User } from "@supabase/supabase-js";
import type { AIAgentKey, AIScope } from "@/lib/ai/core/types";
import type { AIAuthContext } from "@/lib/ai/permissions";
import { getUserPermissions } from "@/lib/services/rbac";
import { listEnabledFeatures } from "@/lib/services/entitlements";

export async function buildAiAuthContext(input: {
  supabase: SupabaseClient;
  user: User;
  organizationId: string;
  siteId?: string | null;
  projectId?: string | null;
  isPlatformAdmin?: boolean;
  agentKey: AIAgentKey;
  scope: AIScope;
}): Promise<AIAuthContext> {
  const [permissions, entitlements] = await Promise.all([
    getUserPermissions(input.supabase, input.organizationId, input.user.id),
    listEnabledFeatures(input.supabase, input.organizationId),
  ]);
  return {
    organizationId: input.organizationId,
    userId: input.user.id,
    siteId: input.siteId ?? null,
    projectId: input.projectId ?? null,
    permissions,
    entitlements,
    isPlatformAdmin: Boolean(input.isPlatformAdmin),
    scope: input.scope,
    agentKey: input.agentKey,
  };
}
