import { cn } from "@/lib/utils";

const FIELD_TILES = [
  "Incident",
  "Near miss",
  "LMRA",
  "Permits",
  "Inspect",
  "Actions",
  "Hazard",
  "Training",
  "PPE",
] as const;

/** Marketing phone mock — field home tiles (not a live app chrome clone). */
export function MobilePreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-[min(100%,272px)] rounded-[1.85rem] border-[6px] border-[#071f2d] bg-[#071f2d] p-2 shadow-[var(--shadow-lg)] ring-1 ring-white/10",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-[#eef3f7] text-[#0f172a]">
        <div className="bg-gradient-to-br from-[#0b3a53] to-[#071f2d] px-4 pb-4 pt-3 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-200/80">
            SONIL EHS360
          </p>
          <p className="mt-1 font-display text-sm font-semibold tracking-tight">Field home</p>
          <p className="mt-0.5 text-[11px] text-white/55">17 EHS modules · My Zone</p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 p-2.5">
          {FIELD_TILES.map((item, i) => (
            <div
              key={item}
              className={cn(
                "flex min-h-[3.25rem] flex-col items-center justify-center rounded-xl border px-1 py-2 text-center",
                i === 0
                  ? "border-teal-700/30 bg-teal-50"
                  : "border-[#d7dee7] bg-white",
              )}
            >
              <span
                className={cn(
                  "mb-1 h-1.5 w-1.5 rounded-full",
                  i === 0 ? "bg-[#0f766e]" : "bg-[#94a3b8]",
                )}
                aria-hidden
              />
              <span className="text-[9px] font-semibold leading-tight tracking-tight text-[#0b3a53]">
                {item}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-around border-t border-[#d7dee7] bg-white px-2 py-2.5 text-[9px] font-semibold text-[#64748b]">
          {["Home", "Report", "Actions", "Permits", "Inspect"].map((tab, i) => (
            <span key={tab} className={cn(i === 0 && "text-[#0f766e]")}>
              {tab}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
