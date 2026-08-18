import { ModuleShell } from "@/components/modules/module-shell";
import { SettingsNav } from "@/components/organization/settings-nav";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { BUILTIN_EVAL_CASES, scoreEvalCase } from "@/lib/ai/evaluation";
import { classifyQuery } from "@/lib/ai/retrieval/classify";

export default async function AiEvaluationPage() {
  const access = await requireModuleAccess({
    featureCode: "ai_copilot",
    permission: "ai.evaluate",
  });
  if (!access.entitled || !access.permitted) {
    return (
      <ModuleShell
        title="AI evaluation"
        description="Golden-set probes for Copilot safety"
        featureCode="ai_copilot"
        permission="ai.evaluate"
      />
    );
  }

  const { data: stored } = await access.supabase
    .from("ai_eval_cases")
    .select("id, name, prompt, expected_contains, forbidden_contains")
    .or(`organization_id.eq.${access.organization.id},organization_id.is.null`)
    .eq("is_active", true);

  const cases = (stored ?? []).length
    ? stored!.map((row) => ({
        name: row.name,
        prompt: row.prompt,
        expectedContains: row.expected_contains ?? [],
        forbiddenContains: row.forbidden_contains ?? [],
      }))
    : BUILTIN_EVAL_CASES;

  return (
    <ModuleShell
      title="AI evaluation"
      description="Lightweight probes. Full golden-set runner UI is deferred."
      featureCode="ai_copilot"
      permission="ai.evaluate"
    >
      <SettingsNav current="/app/settings/ai/evaluation" />
      <div className="space-y-3">
        {cases.map((testCase) => {
          const classified = classifyQuery(testCase.prompt);
          const preview =
            classified.class === "forbidden_cross_tenant"
              ? "I can only search this organization. Cross-customer requests are refused."
              : `Classified as ${classified.class}`;
          const scored = scoreEvalCase(preview, testCase);
          return (
            <div key={testCase.name} className="rounded-2xl border border-border bg-card p-4">
              <p className="text-sm font-semibold">{testCase.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">{testCase.prompt}</p>
              <p className="mt-2 text-sm">{preview}</p>
              <p className="mt-1 text-xs">{scored.passed ? "Probe pattern matched." : "Needs a live model run (deferred)."}</p>
            </div>
          );
        })}
      </div>
    </ModuleShell>
  );
}
