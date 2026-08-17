import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ModuleCardProps = {
  name: string;
  summary: string;
  href: string;
  field?: string;
  dashboard?: string;
  className?: string;
};

export function ModuleCard({ name, summary, href, field, dashboard, className }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card p-5 transition-[border-color,background-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:bg-muted/40 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:hover:shadow-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-semibold tracking-tight text-primary">{name}</h3>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent motion-reduce:transition-none" />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
      {field || dashboard ? (
        <dl className="mt-4 grid gap-2 border-t border-border pt-3 text-xs leading-relaxed">
          {field ? (
            <div>
              <dt className="font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">Field</dt>
              <dd className="mt-0.5 text-muted-foreground">{field}</dd>
            </div>
          ) : null}
          {dashboard ? (
            <div>
              <dt className="font-semibold uppercase tracking-[0.14em] text-[var(--mkt-infra)]">Dashboard</dt>
              <dd className="mt-0.5 text-muted-foreground">{dashboard}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </Link>
  );
}
