import type { HealthScoreResult } from "@/lib/analytics/types";

export function HealthScoreCard({ health }: { health: HealthScoreResult }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Optional EHS Health
          </p>
          <p className="mt-1 font-display text-3xl font-semibold tabular-nums">
            {health.score == null ? "—" : health.score}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Weighted 0–100 from recorded KPIs. Not a certification.
          </p>
        </div>
        <details className="max-w-xl text-sm">
          <summary className="cursor-pointer font-medium text-foreground">How is this calculated?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground">
            {health.explanation.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <table className="mt-3 w-full text-left text-xs">
            <thead>
              <tr className="text-muted-foreground">
                <th className="py-1 font-medium">Component</th>
                <th className="py-1 font-medium">Weight</th>
                <th className="py-1 font-medium">Score</th>
              </tr>
            </thead>
            <tbody>
              {health.components.map((c) => (
                <tr key={c.code} className="border-t border-border">
                  <td className="py-1">{c.label}</td>
                  <td className="py-1">{c.weight}</td>
                  <td className="py-1">{c.included ? c.score : "Omitted"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </div>
    </section>
  );
}
