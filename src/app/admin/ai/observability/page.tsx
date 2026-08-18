import { requirePlatformAdmin } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { listProviders } from "@/lib/ai/models/router";
import { isAiConfigured } from "@/lib/ai/core/config";

export default async function AiObservabilityPage() {
  await requirePlatformAdmin();
  let usage: Array<{ organization_id: string; token_in: number; token_out: number; created_at: string; model_id: string | null }> = [];
  let tools: Array<{ tool_name: string; status: string; created_at: string; organization_id: string }> = [];
  try {
    const admin = createAdminClient();
    const [{ data: usageRows }, { data: toolRows }] = await Promise.all([
      admin.from("ai_usage_events").select("organization_id, token_in, token_out, created_at, model_id").order("created_at", { ascending: false }).limit(50),
      admin.from("ai_tool_calls").select("tool_name, status, created_at, organization_id").order("created_at", { ascending: false }).limit(50),
    ]);
    usage = usageRows ?? [];
    tools = toolRows ?? [];
  } catch {
    usage = [];
    tools = [];
  }

  const providers = listProviders();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">AI observability</h1>
        <p className="text-sm text-muted-foreground">
          Platform-admin view of Copilot usage. Tenant data remains org-scoped in the customer app.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p>Model configured: {isAiConfigured() ? "yes" : "no (deterministic fallback)"}</p>
        <ul className="mt-2 space-y-1 text-muted-foreground">
          {providers.map((p) => (
            <li key={p.name}>
              {p.name}: {p.configured ? "key present" : "not configured"}
            </li>
          ))}
        </ul>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Recent usage</h2>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {usage.length === 0 ? <li>No usage events.</li> : null}
            {usage.map((row, i) => (
              <li key={`${row.created_at}-${i}`}>
                {row.created_at} · in {row.token_in} / out {row.token_out} · {row.model_id ?? "n/a"}
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Recent tool calls</h2>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {tools.length === 0 ? <li>No tool calls.</li> : null}
            {tools.map((row, i) => (
              <li key={`${row.created_at}-${i}`}>
                {row.tool_name} · {row.status} · {row.created_at}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
