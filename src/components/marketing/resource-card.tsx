import Link from "next/link";
import { cn } from "@/lib/utils";
import type { MarketingResource } from "@/lib/marketing/content";

type ResourceCardProps = {
  resource: MarketingResource;
  className?: string;
  /** Larger title on the resources hub page */
  variant?: "default" | "hub";
};

export function ResourceCard({ resource, className, variant = "default" }: ResourceCardProps) {
  const isAvailable = resource.availability === "AVAILABLE";

  const inner = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {resource.category}
        </p>
        <p
          className={cn(
            "inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
            isAvailable
              ? "bg-[var(--mkt-safety)]/12 text-[var(--mkt-safety)]"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isAvailable ? "Available" : "Coming soon"}
        </p>
      </div>
      <h3
        className={cn(
          "mt-3 font-display font-semibold text-primary",
          variant === "hub" ? "text-xl" : "text-base",
        )}
      >
        {resource.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{resource.description}</p>
      {isAvailable && resource.href && resource.cta ? (
        <p className="mt-4 text-sm font-semibold text-accent">{resource.cta} →</p>
      ) : null}
    </>
  );

  const cardClassName = cn(
    "rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-sm)]",
    isAvailable && "transition-colors hover:border-accent/40 motion-reduce:transition-none",
    className,
  );

  if (isAvailable && resource.href) {
    return (
      <Link href={resource.href} className={cardClassName}>
        {inner}
      </Link>
    );
  }

  return <div className={cardClassName}>{inner}</div>;
}
