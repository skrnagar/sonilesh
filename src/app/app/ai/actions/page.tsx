import { ModuleShell } from "@/components/modules/module-shell";
import { SuggestionDecisionForm } from "@/components/ai/suggestion-actions";
import { Badge } from "@/components/ui/badge";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function AiActionsPage() {
  const access = await requireModuleAccess({
    featureCode: "ai_copilot",
    permission: "ai.approve",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="AI suggestions"
        description="Human approval gate for AI-generated drafts"
        featureCode="ai_copilot"
        permission="ai.approve"
      />
    );
  }

  const { data: rows } = await access.supabase
    .from("ai_suggestions")
    .select("id, title, suggestion_type, status, ai_generated, created_at, payload")
    .eq("organization_id", access.organization.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <ModuleShell
      title="AI suggestion approval"
      description="AI cannot approve its own drafts. Approve, edit, or reject before anything is applied to CAPA, actions, or records."
      featureCode="ai_copilot"
      permission="ai.approve"
    >
      <div className="space-y-3">
        {(rows ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No AI drafts yet.</p>
        ) : (
          (rows ?? []).map((row) => (
            <div key={row.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold">{row.title}</h2>
                <Badge variant="secondary">{row.suggestion_type}</Badge>
                <Badge variant={row.status === "pending" ? "warning" : "success"}>{row.status}</Badge>
                {row.ai_generated ? <Badge variant="outline">AI_GENERATED</Badge> : null}
              </div>
              <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-muted/40 p-2 text-[11px] text-muted-foreground">
                {JSON.stringify(row.payload, null, 2)}
              </pre>
              {row.status === "pending" ? (
                <div className="mt-3">
                  <SuggestionDecisionForm suggestionId={row.id} />
                </div>
              ) : null}
            </div>
          ))
        )}
      </div>
    </ModuleShell>
  );
}
