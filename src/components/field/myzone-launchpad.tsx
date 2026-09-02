import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { MyZoneTileGrid } from "@/components/navigation/myzone-tile-grid";
import type { ResolvedIQualityTile } from "@/lib/navigation/iquality-launchpad";
import type { ResolvedMyZoneTile } from "@/lib/navigation/myzone-launchpad";
import type { ResolvedEhsOperationsTile } from "@/lib/navigation/ehs-operations-launchpad";
import { cn } from "@/lib/utils";

type HubShellProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
  className?: string;
};

export function MyZoneHubShell({
  title,
  subtitle,
  backHref,
  backLabel = "Back to My Zone",
  children,
  className,
}: HubShellProps) {
  return (
    <section className={cn("myzone-hub -mx-3 min-h-[calc(100dvh-8rem)] px-3 py-6 sm:-mx-4 sm:px-4 lg:-mx-6 lg:px-6", className)}>
      <div className="mx-auto w-full max-w-6xl space-y-6">
        {backHref ? (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-white/80 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        ) : null}
        <header className="space-y-1">
          <h1 className="font-display text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          {subtitle ? <p className="text-sm text-white/75">{subtitle}</p> : null}
        </header>
        {children}
      </div>
    </section>
  );
}

export function MyZoneLaunchpad({
  tiles,
  greeting,
  userName,
  siteName,
  projectName,
}: {
  tiles: ResolvedMyZoneTile[];
  greeting: string;
  userName: string;
  siteName: string;
  projectName: string;
}) {
  return (
    <MyZoneHubShell title="My Zone">
      <div className="space-y-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">{greeting}</p>
        <p className="font-display text-lg font-semibold text-white">{userName}</p>
        <p className="truncate text-sm text-white/70">
          {siteName} · {projectName}
        </p>
      </div>
      <MyZoneTileGrid tiles={tiles} columns="hub" />
      <p className="text-center text-[11px] text-white/60 lg:hidden">
        Copyright © 2026 SONIL EHS360
      </p>
    </MyZoneHubShell>
  );
}

export function IQualityLaunchpad({ tiles }: { tiles: ResolvedIQualityTile[] }) {
  return (
    <MyZoneHubShell
      title="iQuality"
      subtitle="Quality management modules"
      backHref="/field/my-zone"
      backLabel="Back to My Zone"
    >
      <MyZoneTileGrid tiles={tiles} iconSet="iquality" favoritesKey="sonil-iquality-favorites" columns="subhub" />
    </MyZoneHubShell>
  );
}

export function EhsOperationsLaunchpad({ tiles }: { tiles: ResolvedEhsOperationsTile[] }) {
  return (
    <MyZoneHubShell
      title="EHS Operations"
      subtitle="Field safety and compliance modules"
      backHref="/field"
      backLabel="Back to Home"
    >
      <MyZoneTileGrid tiles={tiles} iconSet="ehs-ops" favoritesKey="sonil-ehs-ops-favorites" columns="subhub" />
    </MyZoneHubShell>
  );
}
