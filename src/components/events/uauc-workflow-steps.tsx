import { cn } from "@/lib/utils";
import {
  getUaucStepIndex,
  resolveUaucWorkflowStep,
  UAUC_WORKFLOW_STEPS,
  type UaucWorkflowContext,
} from "@/lib/services/workflow";

export function UaucWorkflowSteps({
  status,
  uaucStage,
  assignedTo,
  className,
}: UaucWorkflowContext & { className?: string }) {
  const current = resolveUaucWorkflowStep({ status, uaucStage, assignedTo });
  const currentIndex = getUaucStepIndex(current);

  return (
    <ol
      className={cn(
        "flex flex-wrap gap-1",
        className,
      )}
      aria-label="UA/UC workflow progress"
    >
      {UAUC_WORKFLOW_STEPS.map((step, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const upcoming = index > currentIndex;

        return (
          <li
            key={step.key}
            className={cn(
              "flex min-w-0 flex-1 basis-[calc(25%-0.25rem)] items-center gap-1 sm:basis-auto",
            )}
          >
            <span
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold",
                done && "bg-primary text-primary-foreground",
                active && "bg-[var(--mkt-safety)] text-white ring-2 ring-[var(--mkt-safety)]/30",
                upcoming && "bg-muted text-muted-foreground",
              )}
              aria-current={active ? "step" : undefined}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "hidden truncate text-[10px] font-medium sm:inline",
                active && "text-foreground",
                done && "text-muted-foreground",
                upcoming && "text-muted-foreground/70",
              )}
            >
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
