import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function MobilePreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "mx-auto w-[min(100%,260px)] rounded-[1.75rem] border-[6px] border-[#0b3a53] bg-[#0b3a53] p-2 shadow-[var(--shadow-lg)] ring-1 ring-white/10",
        className,
      )}
    >
      <div className="overflow-hidden rounded-[1.1rem] bg-[#f4f7fa] text-[#0f172a]">
        <div className="bg-[#0b3a53] px-4 pb-4 pt-3 text-white">
          <p className="text-[10px] uppercase tracking-[0.14em] text-white/60">Field</p>
          <p className="mt-1 text-sm font-semibold">Field capture</p>
        </div>
        <div className="space-y-2 p-3">
          {["Incident", "Near miss", "LMRA", "Permit check"].map((item, i) => (
            <div
              key={item}
              className={cn(
                "flex items-center justify-between border px-3 py-2 text-xs",
                i === 0
                  ? "border-[#1f6f8b] bg-[#e8f3f7]"
                  : "border-[#d7dee7] bg-white",
              )}
            >
              <span className="font-medium">{item}</span>
              {i === 0 ? <Badge variant="success">Open</Badge> : null}
            </div>
          ))}
          <div className="border border-[#d7dee7] bg-white p-3">
            <p className="text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Location
            </p>
            <p className="mt-1 text-xs font-medium">Unit B · Scaffold bay 3</p>
            <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-slate-500">
              Severity
            </p>
            <div className="mt-1 flex gap-1">
              <span className="h-2 flex-1 rounded-sm bg-[#0f766e]" />
              <span className="h-2 flex-1 rounded-sm bg-[#ca8a04]" />
              <span className="h-2 flex-1 rounded-sm bg-[#b42318]/40" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
