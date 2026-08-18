import { FieldForbidden, FieldPageHeader } from "@/components/field/field-ui";
import { CopilotChat } from "@/components/ai/copilot-chat";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { isAiConfigured } from "@/lib/ai/core/config";
import { hasFeature } from "@/lib/services/entitlements";
import { userHasPermission } from "@/lib/services/rbac";

export default async function FieldAiPage() {
  const access = await requireModuleAccess({});
  const entitled = await hasFeature(access.supabase, access.organization.id, "ai_copilot");
  const permitted =
    Boolean(access.profile?.is_platform_admin) ||
    (await userHasPermission(access.supabase, access.organization.id, access.user.id, "ai.use"));
  if (!entitled || !permitted) return <FieldForbidden />;

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title="Field Copilot"
        subtitle="Your own reports, actions, permits, and training only — not enterprise-wide data."
      />
      <CopilotChat
        agentKey="field"
        scope="field"
        configured={isAiConfigured()}
        suggestions={[
          "What actions are assigned to me?",
          "Show my active permits",
          "My training assignments",
        ]}
      />
    </div>
  );
}
