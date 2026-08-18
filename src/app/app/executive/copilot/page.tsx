import { ModuleShell } from "@/components/modules/module-shell";
import { CopilotChat } from "@/components/ai/copilot-chat";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { isAiConfigured } from "@/lib/ai/core/config";
import { hasFeature } from "@/lib/services/entitlements";

export default async function ExecutiveCopilotPage() {
  const access = await requireModuleAccess({
    featureCode: "ai_executive_copilot",
    permission: "ai.use",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="Executive Copilot"
        description="Control Tower assistant for recorded EHS metrics"
        featureCode="ai_executive_copilot"
        permission="ai.use"
      />
    );
  }

  const hasTower =
    (await hasFeature(access.supabase, access.organization.id, "executive_analytics")) ||
    (await hasFeature(access.supabase, access.organization.id, "advanced_analytics"));
  if (!hasTower) {
    return (
      <ModuleShell
        title="Executive Copilot"
        description="Requires executive analytics or advanced analytics"
        featureCode="executive_analytics"
        permission="analytics.view"
      />
    );
  }

  return (
    <ModuleShell
      title="Executive Copilot"
      description="Summarizes recorded metrics. Language is “potential risk signal” — never predicted incidents."
      featureCode="ai_executive_copilot"
      permission="ai.use"
    >
      <CopilotChat
        agentKey="executive"
        scope="executive"
        configured={isAiConfigured()}
        suggestions={[
          "Summarize this period’s recorded KPIs",
          "Which CAPA items are overdue?",
          "Compliance tasks that need attention",
        ]}
      />
    </ModuleShell>
  );
}
