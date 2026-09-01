import Link from "next/link";
import { Bot, Sparkles } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleShell } from "@/components/modules/module-shell";
import { Badge } from "@/components/ui/badge";
import { AI_AGENT_KEYS } from "@/lib/ai/core/types";
import { agentDefinition } from "@/lib/ai/agents";

const AGENT_DESCRIPTIONS: Record<string, string> = {
  copilot: "General EHS assistant — available now.",
  incident: "Triage and classify incident reports from narrative text.",
  risk: "Surface risk patterns and suggest controls from assessments.",
  capa: "Draft corrective actions linked to findings and events.",
  document: "Summarize controlled documents and SDS records.",
  executive: "Executive briefings over MIS, scorecard, and trends.",
  field: "Mobile-first capture assist for LMRA and observations.",
};

export default function AiAgentsPage() {
  return (
    <ModuleShell
      title="AI Agents"
      description="Specialized agents for triage, classification, and anomaly detection. Human approval required for all writes."
      featureCode="ai_copilot"
      permission="ai.use"
    >
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "EHS Copilot", href: "/app/ai" },
          { label: "AI Agents" },
        ]}
        className="mb-4"
      />
      <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
        Phase 35 roadmap: autonomous agents that flag anomalies, classify reports, and route work —
        always grounded in tenant data with audit trails.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AI_AGENT_KEYS.map((key) => {
          const def = agentDefinition(key);
          const live = key === "copilot";
          return (
            <article
              key={key}
              className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  {live ? (
                    <Sparkles className="h-4 w-4 text-[var(--mkt-safety)]" />
                  ) : (
                    <Bot className="h-4 w-4 text-muted-foreground" />
                  )}
                </span>
                <Badge variant={live ? "default" : "secondary"}>
                  {live ? "Live" : "Coming soon"}
                </Badge>
              </div>
              <h2 className="mt-3 font-display text-sm font-semibold">{def.title}</h2>
              <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">
                {AGENT_DESCRIPTIONS[key] ?? def.description}
              </p>
              {live ? (
                <Link
                  href="/app/ai"
                  className="mt-3 text-sm font-medium text-accent hover:underline"
                >
                  Open Copilot →
                </Link>
              ) : (
                <span className="mt-3 text-xs text-muted-foreground">Stub — Phase 35</span>
              )}
            </article>
          );
        })}
      </div>
    </ModuleShell>
  );
}
