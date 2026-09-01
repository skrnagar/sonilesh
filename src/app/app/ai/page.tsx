import dynamic from "next/dynamic";
import { ModuleShell } from "@/components/modules/module-shell";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { isAiConfigured } from "@/lib/ai/core/config";
import { canUseAgent } from "@/lib/ai/permissions";
import { getUserPermissions } from "@/lib/services/rbac";
import { listEnabledFeatures } from "@/lib/services/entitlements";

const CopilotChat = dynamic(
  () => import("@/components/ai/copilot-chat").then((m) => m.CopilotChat),
  {
    loading: () => <div className="h-96 rounded-2xl border border-border bg-card" />,
  },
);

export default async function AiCopilotPage() {
  const access = await requireModuleAccess({
    featureCode: "ai_copilot",
    permission: "ai.use",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="EHS Copilot"
        description="AI assistance over your organization’s EHS records"
        featureCode="ai_copilot"
        permission="ai.use"
      />
    );
  }

  const [permissions, entitlements] = await Promise.all([
    getUserPermissions(access.supabase, access.organization.id, access.user.id),
    listEnabledFeatures(access.supabase, access.organization.id),
  ]);
  const allowed = canUseAgent({
    organizationId: access.organization.id,
    userId: access.user.id,
    siteId: access.siteId,
    projectId: access.projectId,
    permissions,
    entitlements,
    isPlatformAdmin: Boolean(access.profile?.is_platform_admin),
    scope: "workspace",
    agentKey: "copilot",
  });
  if (!allowed) {
    return (
      <ModuleShell
        title="EHS Copilot"
        description="AI assistance over your organization’s EHS records"
        featureCode="ai_copilot"
        permission="ai.use"
      />
    );
  }

  return (
    <ModuleShell
      title="EHS Copilot"
      description="Tools run inside your tenant. Drafts need human approval. Retrieved documents are treated as data, not instructions."
      featureCode="ai_copilot"
      permission="ai.use"
    >
      <CopilotChat configured={isAiConfigured()} />
    </ModuleShell>
  );
}
