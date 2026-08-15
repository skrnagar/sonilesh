import type { RiskBand } from "@/lib/services/risk";
import { resolveBand, scoreRisk } from "@/lib/services/risk";

export function RiskMatrixVisual({
  likelihoodMax = 5,
  consequenceMax = 5,
  bands,
  likelihoodLabels = [],
  consequenceLabels = [],
}: {
  likelihoodMax?: number;
  consequenceMax?: number;
  bands: RiskBand[];
  likelihoodLabels?: string[];
  consequenceLabels?: string[];
}) {
  const colorFor = (score: number) => {
    const band = bands.find((b) => score >= b.min_score && score <= b.max_score);
    return band?.color ?? "#94a3b8";
  };

  return (
    <div className="space-y-3">
      <div className="overflow-x-auto">
        <table className="border-collapse text-center text-xs">
          <thead>
            <tr>
              <th className="p-2 text-muted-foreground">L \ C</th>
              {Array.from({ length: consequenceMax }, (_, i) => (
                <th key={i} className="p-2 font-medium">
                  {consequenceLabels[i] ?? i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: likelihoodMax }, (_, li) => {
              const l = likelihoodMax - li;
              return (
                <tr key={l}>
                  <th className="p-2 text-left font-medium">
                    {likelihoodLabels[l - 1] ?? l}
                  </th>
                  {Array.from({ length: consequenceMax }, (_, ci) => {
                    const c = ci + 1;
                    const score = scoreRisk(l, c);
                    return (
                      <td
                        key={c}
                        className="h-12 w-12 border border-border text-sm font-semibold text-white"
                        style={{ background: colorFor(score) }}
                        title={resolveBand(score, bands) ?? undefined}
                      >
                        {score}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        {bands.map((b) => (
          <span
            key={b.code}
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"
          >
            <span
              className="inline-block h-3 w-3 rounded-sm"
              style={{ background: b.color ?? "#94a3b8" }}
            />
            {b.name} ({b.min_score}–{b.max_score})
          </span>
        ))}
      </div>
    </div>
  );
}
