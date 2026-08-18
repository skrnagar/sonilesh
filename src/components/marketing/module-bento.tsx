import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { modules } from "@/lib/marketing/content";
import { productHrefForModule } from "@/lib/marketing/product-routes";
import { SAMPLE_CAPA_PIPELINE, SAMPLE_DATA_LABEL, SAMPLE_INCIDENTS } from "@/lib/marketing/sample-board";
import { ModuleCard } from "@/components/marketing/module-card";
import { cn } from "@/lib/utils";

const featured = {
  incidents: modules.find((m) => m.slug === "incidents")!,
  capa: modules.find((m) => m.slug === "capa")!,
};
const rest = modules.filter((m) => m.slug !== "incidents" && m.slug !== "capa").slice(0, 4);

function FeaturedTile({
  name,
  summary,
  href,
  className,
  children,
}: {
  name: string;
  summary: string;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex flex-col rounded-xl border border-border bg-card p-5 transition-[border-color,box-shadow] duration-200 hover:border-accent/40 hover:shadow-[var(--shadow-md)] motion-reduce:transition-none",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold tracking-tight text-primary">{name}</h3>
        <ArrowUpRight className="h-4 w-4 shrink-0 text-muted-foreground" />
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{summary}</p>
      <div className="mt-4 min-w-0 flex-1">{children}</div>
    </Link>
  );
}

export function ModuleBento() {
  return (
    <div className="mkt-bento">
      <FeaturedTile
        name={featured.incidents.name}
        summary={featured.incidents.summary}
        href={productHrefForModule(featured.incidents.slug)}
        className="mkt-bento-incidents"
      >
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {SAMPLE_DATA_LABEL}
        </p>
        <ul className="space-y-2">
          {SAMPLE_INCIDENTS.map((row) => (
            <li key={row.id} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-foreground/80">{row.title}</span>
              <span
                className={cn(
                  "shrink-0 rounded-sm px-1.5 py-0.5 font-medium",
                  row.severity === "High" && "bg-[var(--danger-soft)] text-[var(--danger-ink)]",
                  row.severity === "Medium" && "bg-[var(--warning-soft)] text-[var(--warning-ink)]",
                  row.severity === "Low" && "bg-muted text-muted-foreground",
                )}
              >
                {row.severity}
              </span>
            </li>
          ))}
        </ul>
      </FeaturedTile>
      <FeaturedTile
        name={featured.capa.name}
        summary={featured.capa.summary}
        href={productHrefForModule(featured.capa.slug)}
        className="mkt-bento-capa"
      >
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          {SAMPLE_DATA_LABEL}
        </p>
        <ul className="space-y-2">
          {SAMPLE_CAPA_PIPELINE.map((row) => (
            <li key={row.status} className="text-xs">
              <div className="flex justify-between gap-2">
                <span>{row.status}</span>
                <span className="tabular-nums text-muted-foreground">{row.count}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-[var(--mkt-safety)]"
                  style={{ width: `${(row.count / 20) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      </FeaturedTile>
      {rest.map((mod) => (
        <ModuleCard
          key={mod.slug}
          name={mod.name}
          summary={mod.summary}
          field={mod.field}
          dashboard={mod.dashboard}
          href={productHrefForModule(mod.slug)}
          className="mkt-bento-tile"
        />
      ))}
    </div>
  );
}
