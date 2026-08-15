import { lifecycleSteps } from "@/lib/marketing/content";
import { cn } from "@/lib/utils";

export function WorkflowDiagram({ className }: { className?: string }) {
  return (
    <ol className={cn("grid gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-5", className)}>
      {lifecycleSteps.map((step, index) => (
        <li key={step.title} className="relative bg-card p-4 md:p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {String(index + 1).padStart(2, "0")}
          </p>
          <p className="mt-3 text-base font-semibold tracking-tight text-primary">{step.title}</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.detail}</p>
        </li>
      ))}
    </ol>
  );
}
