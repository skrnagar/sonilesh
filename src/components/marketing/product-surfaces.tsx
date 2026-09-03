import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { productSurfaces } from "@/lib/marketing/content";
import { Stagger } from "@/components/marketing/reveal";

/** Atlassian-style product family grid — one job: clarify the app surfaces. */
export function ProductSurfaces() {
  return (
    <Stagger className="grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2">
      {productSurfaces.map((surface) => (
        <Link
          key={surface.title}
          href={surface.href}
          className="group relative flex min-h-[11rem] flex-col bg-background p-6 transition-colors hover:bg-[var(--mkt-band)] md:bg-[var(--mkt-band)] md:p-8 md:hover:bg-card"
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-display text-xl font-semibold tracking-tight text-primary md:text-2xl">
              {surface.title}
            </h3>
            <ArrowUpRight
              className="mt-1 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--mkt-safety)] motion-reduce:transition-none"
              aria-hidden
            />
          </div>
          <p className="mt-3 max-w-md flex-1 text-sm leading-relaxed text-muted-foreground md:text-[15px]">
            {surface.body}
          </p>
          <span className="mt-5 text-sm font-semibold text-[var(--mkt-safety)]">
            Learn more
          </span>
        </Link>
      ))}
    </Stagger>
  );
}
