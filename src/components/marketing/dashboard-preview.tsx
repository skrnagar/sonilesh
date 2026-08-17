import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function DashboardPreview({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid gap-3 rounded-md bg-[#f4f7fa] p-3 text-[#0f172a] sm:grid-cols-[180px_1fr]",
        className,
      )}
    >
      <aside className="hidden space-y-1 rounded-md bg-[#0b3a53] p-3 text-white sm:block">
        <p className="mb-2 text-xs font-semibold tracking-wide text-white/70">Workspace</p>
        {["Dashboard", "Incidents", "Permits", "Compliance", "ESG", "Analytics"].map(
          (item, i) => (
            <div
              key={item}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs",
                i === 0 ? "bg-white/15 font-medium" : "text-white/70",
              )}
            >
              {item}
            </div>
          ),
        )}
      </aside>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Operations</p>
            <p className="text-sm font-semibold tracking-tight">Site control board</p>
          </div>
          <Badge variant="success" className="mkt-status-cycle">
            Live view
          </Badge>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-md border border-[#d7dee7] bg-white px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Open incidents</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-primary">
              <span className="sr-only">12</span>
              <span className="mkt-tick" aria-hidden>
                <span className="mkt-tick-track">
                  <span>12</span>
                  <span>13</span>
                  <span>12</span>
                </span>
              </span>
            </p>
          </div>
          <div className="rounded-md border border-[#d7dee7] bg-white px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Overdue CAPA</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[#b45309]">4</p>
          </div>
          <div className="rounded-md border border-[#d7dee7] bg-white px-2.5 py-2">
            <p className="text-[10px] uppercase tracking-[0.1em] text-slate-500">Permits active</p>
            <p className="mt-1 text-lg font-semibold tabular-nums text-[#0f766e]">27</p>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="rounded-md border border-[#d7dee7] bg-white p-3">
            <p className="text-xs font-semibold">Risk heat</p>
            <div className="mt-3 grid grid-cols-5 gap-1">
              {Array.from({ length: 25 }).map((_, i) => {
                const level = (i % 5) + Math.floor(i / 5);
                const bg =
                  level > 6
                    ? "bg-[#b42318]/80"
                    : level > 4
                      ? "bg-[#b45309]/70"
                      : level > 2
                        ? "bg-[#ca8a04]/60"
                        : "bg-[#0f766e]/50";
                return <div key={i} className={cn("aspect-square rounded-[2px]", bg)} />;
              })}
            </div>
          </div>
          <div className="rounded-md border border-[#d7dee7] bg-white p-3">
            <p className="text-xs font-semibold">CAPA pipeline</p>
            <ul className="mt-3 space-y-2">
              {[
                ["Lockout verification", "Due today", "warning"],
                ["Scaffold inspection gap", "In progress", "default"],
                ["Near-miss trend review", "Verified", "success"],
              ].map(([title, status, variant]) => (
                <li
                  key={title}
                  className="flex items-center justify-between gap-2 text-xs"
                >
                  <span className="truncate text-slate-700">{title}</span>
                  <Badge
                    variant={
                      variant === "warning"
                        ? "warning"
                        : variant === "success"
                          ? "success"
                          : "secondary"
                    }
                  >
                    {status}
                  </Badge>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
