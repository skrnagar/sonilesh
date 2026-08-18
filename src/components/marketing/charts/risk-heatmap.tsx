import { cn } from "@/lib/utils";
import {
  RISK_CONSEQUENCE_LABELS,
  RISK_LIKELIHOOD_LABELS,
  SAMPLE_DATA_LABEL,
  SAMPLE_RISK_COUNTS,
  sampleRiskBand,
} from "@/lib/marketing/sample-board";

const BAND_BG = {
  low: "bg-[color-mix(in_srgb,var(--mkt-safety)_72%,white)]",
  medium: "bg-[color-mix(in_srgb,var(--chart-2)_82%,white)]",
  high: "bg-[color-mix(in_srgb,var(--mkt-infra)_88%,black)]",
  critical: "bg-[color-mix(in_srgb,var(--destructive)_88%,black)]",
} as const;

const BAND_FG = {
  low: "text-white",
  medium: "text-[#1c1917]",
  high: "text-white",
  critical: "text-white",
} as const;

export function RiskHeatmap({ className }: { className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-semibold text-foreground">Risk matrix (5×5)</p>
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {SAMPLE_DATA_LABEL} · illustrative
        </p>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Likelihood × consequence — same Default 5×5 bands as the product matrix (score = L × C).
      </p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[280px] border-collapse text-center text-[10px] sm:text-xs">
          <caption className="sr-only">
            Sample 5 by 5 likelihood by consequence heatmap with round counts
          </caption>
          <thead>
            <tr>
              <th className="p-1 text-left font-medium text-muted-foreground">L \ C</th>
              {RISK_CONSEQUENCE_LABELS.map((label, i) => (
                <th key={label} className="p-1 font-medium text-muted-foreground">
                  <span className="hidden sm:inline">{i + 1}</span>
                  <span className="sm:hidden">{i + 1}</span>
                  <span className="mt-0.5 hidden text-[9px] font-normal lg:block">{label}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SAMPLE_RISK_COUNTS.map((row, ri) => {
              const likelihood = 5 - ri;
              return (
                <tr key={likelihood}>
                  <th className="whitespace-nowrap p-1 text-left font-medium text-muted-foreground">
                    {likelihood}
                    <span className="ml-1 hidden font-normal lg:inline">
                      {RISK_LIKELIHOOD_LABELS[likelihood - 1]}
                    </span>
                  </th>
                  {row.map((count, ci) => {
                    const consequence = ci + 1;
                    const score = likelihood * consequence;
                    const band = sampleRiskBand(score);
                    return (
                      <td key={consequence} className="p-0.5">
                        <div
                          className={cn(
                            "flex aspect-square min-h-8 min-w-8 items-center justify-center rounded-[3px] text-[11px] font-semibold tabular-nums sm:min-h-9 sm:min-w-9",
                            BAND_BG[band],
                            BAND_FG[band],
                          )}
                          title={`L${likelihood} × C${consequence} = ${score} · ${band} · count ${count}`}
                        >
                          {count}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <li className="inline-flex items-center gap-1">
          <span className={cn("h-2 w-2 rounded-sm", BAND_BG.low)} /> Low 1–4
        </li>
        <li className="inline-flex items-center gap-1">
          <span className={cn("h-2 w-2 rounded-sm", BAND_BG.medium)} /> Medium 5–9
        </li>
        <li className="inline-flex items-center gap-1">
          <span className={cn("h-2 w-2 rounded-sm", BAND_BG.high)} /> High 10–14
        </li>
        <li className="inline-flex items-center gap-1">
          <span className={cn("h-2 w-2 rounded-sm", BAND_BG.critical)} /> Critical 15–25
        </li>
      </ul>
    </div>
  );
}
