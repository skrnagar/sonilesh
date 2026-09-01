import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import {
  LAUNCHPAD_SECTION_LABELS,
  LAUNCHPAD_SECTION_ORDER,
  type LaunchpadSection,
  type LaunchpadTile,
} from "@/lib/navigation/launchpad";
import { cn } from "@/lib/utils";

const ACCENT: Record<string, string> = {
  navy: "border-[var(--mkt-navy)]/20 bg-[var(--mkt-navy)]/5 hover:border-[var(--mkt-navy)]/40",
  teal: "border-[var(--mkt-safety)]/25 bg-[var(--mkt-safety)]/8 hover:border-[var(--mkt-safety)]/45",
  amber: "border-amber-500/25 bg-amber-500/8 hover:border-amber-500/45",
  red: "border-red-500/20 bg-red-500/5 hover:border-red-500/40",
  slate: "border-border bg-muted/30 hover:border-border/80",
};

export function OpsTileGrid({
  tiles,
  columns = "default",
}: {
  tiles: LaunchpadTile[];
  columns?: "default" | "compact" | "wide";
}) {
  if (!tiles.length) return null;

  const gridClass =
    columns === "compact"
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      : columns === "wide"
        ? "grid-cols-1 sm:grid-cols-2"
        : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={cn("grid gap-3", gridClass)}>
      {tiles.map((tile) => (
        <LaunchTileCard key={tile.key} tile={tile} />
      ))}
    </div>
  );
}

function LaunchTileCard({ tile, size = "default" }: { tile: LaunchpadTile; size?: "default" | "hero" }) {
  const Icon = tile.icon;
  return (
    <Link
      href={tile.href}
      className={cn(
        "group flex flex-col rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-200 hover:shadow-[var(--shadow-md)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100",
        size === "hero" ? "min-h-[8.5rem]" : "min-h-[7.5rem]",
        ACCENT[tile.accent ?? "slate"],
      )}
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-[var(--shadow-sm)]">
        <Icon className="h-4.5 w-4.5 text-foreground" />
      </span>
      <span className="mt-3 font-display text-sm font-semibold tracking-tight text-foreground group-hover:text-primary">
        {tile.label}
      </span>
      <span className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
        {tile.description}
      </span>
    </Link>
  );
}

function SectionHeader({
  section,
  count,
}: {
  section: LaunchpadSection;
  count?: number;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2 className="font-display text-base font-semibold tracking-tight text-foreground">
        {LAUNCHPAD_SECTION_LABELS[section]}
      </h2>
      {count !== undefined && count > 0 ? (
        <span className="text-xs text-muted-foreground">{count} modules</span>
      ) : null}
    </div>
  );
}

function AiCopilotBanner({ tiles }: { tiles: LaunchpadTile[] }) {
  const copilot = tiles.find((t) => t.key === "ai-copilot");
  const search = tiles.find((t) => t.key === "search");
  if (!copilot) return null;

  const Icon = copilot.icon;
  return (
    <section className="space-y-3">
      <SectionHeader section="ai" />
      <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
        <Link
          href={copilot.href}
          className="group flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--mkt-safety)]/30 bg-gradient-to-br from-[var(--mkt-safety)]/10 to-card p-5 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] hover:border-[var(--mkt-safety)]/50 hover:shadow-[var(--shadow-md)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card shadow-[var(--shadow-sm)]">
            <Icon className="h-5 w-5 text-[var(--mkt-safety)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
              {copilot.label}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {copilot.description}. Ask questions over your tenant data — drafts require human approval.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Open Copilot
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>
        </Link>
        {search ? (
          <Link
            href={search.href}
            className="flex min-h-[7rem] flex-col justify-center rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] hover:border-border/80 hover:shadow-[var(--shadow-md)] lg:min-w-[12rem]"
          >
            <Sparkles className="h-4 w-4 text-muted-foreground" />
            <span className="mt-2 font-display text-sm font-semibold">{search.label}</span>
            <span className="mt-0.5 text-xs text-muted-foreground">{search.description}</span>
          </Link>
        ) : null}
      </div>
    </section>
  );
}

export type LaunchpadSections = Record<LaunchpadSection, LaunchpadTile[]>;

export function HomeLaunchpad({
  persona,
  sections,
  organizationName,
  userName,
}: {
  persona: string;
  sections: LaunchpadSections;
  organizationName: string;
  userName: string;
}) {
  const dashboardTiles = sections.dashboard;
  const operationsTiles = sections.operations;
  const reportsTiles = sections.reports;
  const aiTiles = sections.ai;

  return (
    <div className="app-page-stagger min-w-0 space-y-8">
      <div>
        <Breadcrumbs items={[{ label: "Home", href: "/app/home" }]} className="mb-2" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--mkt-safety)]">
          Enterprise launchpad
        </p>
        <h1 className="mt-1 font-display text-[length:var(--text-app-title)] font-semibold tracking-tight text-foreground">
          Welcome back{userName ? `, ${userName.split(/\s+/)[0]}` : ""}
        </h1>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {persona} workspace for {organizationName}. Launch safety operations, reports, and analytics — not a marketplace.
        </p>
      </div>

      {dashboardTiles.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader section="dashboard" />
          <OpsTileGrid tiles={dashboardTiles} columns="wide" />
        </section>
      ) : null}

      {operationsTiles.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader section="operations" count={operationsTiles.length} />
          <OpsTileGrid tiles={operationsTiles} />
        </section>
      ) : null}

      {reportsTiles.length > 0 ? (
        <section className="space-y-3">
          <SectionHeader section="reports" />
          <OpsTileGrid tiles={reportsTiles} columns="compact" />
        </section>
      ) : null}

      {aiTiles.length > 0 ? <AiCopilotBanner tiles={aiTiles} /> : null}
    </div>
  );
}

/** @deprecated Use LAUNCHPAD_TILES from lib/navigation/launchpad */
export type LaunchTile = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  accent?: "navy" | "teal" | "amber" | "red" | "slate";
};
