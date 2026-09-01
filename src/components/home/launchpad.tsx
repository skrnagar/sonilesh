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

export function OpsTileGrid({
  tiles,
  columns = "default",
  variant = "default",
}: {
  tiles: LaunchpadTile[];
  columns?: "default" | "compact" | "wide";
  variant?: "default" | "raksha";
}) {
  if (!tiles.length) return null;

  const gridClass =
    columns === "compact"
      ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
      : columns === "wide"
        ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";

  return (
    <div className={cn("grid gap-3", gridClass)}>
      {tiles.map((tile) => (
        <LaunchTileCard key={tile.key} tile={tile} variant={variant} />
      ))}
    </div>
  );
}

function LaunchTileCard({
  tile,
  variant = "default",
}: {
  tile: LaunchpadTile;
  variant?: "default" | "raksha";
}) {
  const Icon = tile.icon;

  if (variant === "raksha") {
    return (
      <Link
        href={tile.href}
        className="raksha-module-tile group flex min-h-[6.75rem] flex-col items-center justify-center gap-2 p-3 text-center motion-reduce:transition-none"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--raksha-blue-light)]">
          <Icon className="h-5 w-5 text-[var(--raksha-blue-dark)]" />
        </span>
        <span className="font-display text-xs font-semibold leading-tight text-[var(--raksha-blue-dark)] group-hover:text-[var(--raksha-blue)]">
          {tile.label}
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={tile.href}
      className="group flex min-h-[7.5rem] flex-col rounded-[var(--radius-lg)] border border-border bg-card p-4 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow,transform] duration-200 hover:shadow-[var(--shadow-md)] active:scale-[0.99] motion-reduce:transition-none motion-reduce:active:scale-100"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shadow-[var(--shadow-sm)]">
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
  onBlue = false,
}: {
  section: LaunchpadSection;
  count?: number;
  onBlue?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <h2
        className={cn(
          "font-display text-base font-semibold tracking-tight",
          onBlue ? "raksha-section-tab" : "text-foreground",
        )}
      >
        {LAUNCHPAD_SECTION_LABELS[section]}
      </h2>
      {count !== undefined && count > 0 ? (
        <span
          className={cn(
            "text-xs",
            onBlue ? "text-white/70" : "text-muted-foreground",
          )}
        >
          {count} modules
        </span>
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
          className="group flex items-start gap-4 rounded-[var(--radius-lg)] border border-[var(--raksha-blue)]/25 bg-gradient-to-br from-[var(--raksha-blue-light)] to-card p-5 shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] hover:border-[var(--raksha-blue)]/45 hover:shadow-[var(--shadow-md)]"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-card shadow-[var(--shadow-sm)]">
            <Icon className="h-5 w-5 text-[var(--raksha-blue)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold tracking-tight text-foreground group-hover:text-[var(--raksha-blue-dark)]">
              {copilot.label}
            </p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {copilot.description}. Ask questions over your tenant data — drafts require human approval.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[var(--raksha-blue)]">
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
    <div className="app-page-stagger min-w-0 space-y-6">
      <div className="raksha-module-panel">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/80">
              EHS360
            </p>
            <h1 className="mt-1 font-display text-[length:var(--text-app-title)] font-semibold tracking-tight text-white">
              Welcome{userName ? `, ${userName.split(/\s+/)[0]}` : ""}
            </h1>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-white/75">
              {persona} · {organizationName}
            </p>
          </div>
          <div className="hidden gap-6 sm:flex">
            {(["dashboard", "operations", "reports"] as LaunchpadSection[]).map((key) => {
              const count =
                key === "dashboard"
                  ? dashboardTiles.length
                  : key === "operations"
                    ? operationsTiles.length
                    : reportsTiles.length;
              if (!count) return null;
              return (
                <div key={key} className="text-center">
                  <p className="raksha-section-tab">{LAUNCHPAD_SECTION_LABELS[key]}</p>
                  <p className="mt-1 font-display text-lg font-semibold text-white">{count}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="px-0.5">
        <Breadcrumbs items={[{ label: "Home", href: "/app/home" }]} className="mb-2" />
      </div>

      {dashboardTiles.length > 0 ? (
        <section className="raksha-module-panel space-y-4">
          <SectionHeader section="dashboard" onBlue />
          <OpsTileGrid tiles={dashboardTiles} columns="wide" variant="raksha" />
        </section>
      ) : null}

      {operationsTiles.length > 0 ? (
        <section className="raksha-module-panel space-y-4">
          <SectionHeader section="operations" count={operationsTiles.length} onBlue />
          <OpsTileGrid tiles={operationsTiles} variant="raksha" />
        </section>
      ) : null}

      {reportsTiles.length > 0 ? (
        <section className="raksha-module-panel space-y-4">
          <SectionHeader section="reports" onBlue />
          <OpsTileGrid tiles={reportsTiles} columns="compact" variant="raksha" />
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
