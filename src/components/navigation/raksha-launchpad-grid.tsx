"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileSpreadsheet,
  FileText,
  Gauge,
  GraduationCap,
  Home,
  LayoutGrid,
  LayoutTemplate,
  MapPin,
  ScanSearch,
  Shield,
  ThumbsUp,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { RakshaLaunchpadKey, ResolvedRakshaTile } from "@/lib/navigation/raksha-launchpad";
import { cn } from "@/lib/utils";

const RAKSHA_TILE_ICONS: Record<RakshaLaunchpadKey, LucideIcon> = {
  "my-zone": Home,
  "raksha-reports": FileText,
  "ua-uc-wsn": Eye,
  incident: AlertTriangle,
  "hsv-rsv": MapPin,
  "tsv-hsr-rsr-wer": Shield,
  utilities: Wrench,
  training: GraduationCap,
  "ehs-mis": FileSpreadsheet,
  "ehs-score": Gauge,
  nc: ClipboardList,
  checklist: ClipboardCheck,
  "new-checklist": LayoutGrid,
  "checklist-template": LayoutTemplate,
  lmra: ScanSearch,
  "work-permit": Shield,
  bbs: ThumbsUp,
};

export type RakshaGridTile = ResolvedRakshaTile;

export function RakshaLaunchpadGrid({ tiles }: { tiles: RakshaGridTile[] }) {
  const pathname = usePathname();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    setPendingKey(null);
  }, [pathname]);

  if (!tiles.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4">
      {tiles.map((tile) => {
        const Icon = RAKSHA_TILE_ICONS[tile.key] ?? Home;
        const pending = pendingKey === tile.key;
        const active =
          tile.href === "/field"
            ? pathname === "/field" || pathname === "/field/home"
            : tile.href === "/field/my-zone"
              ? pathname === "/field/my-zone"
              : pathname === tile.href || pathname.startsWith(`${tile.href}/`) || pathname.startsWith(`${tile.href}?`);
        return (
          <Link
            key={tile.key}
            href={tile.href}
            prefetch={tile.prefetch}
            aria-busy={pending || undefined}
            aria-current={active ? "page" : undefined}
            data-active={active || undefined}
            onClick={() => setPendingKey(tile.key)}
            className={cn(
              "raksha-module-tile group flex min-h-[6.75rem] flex-col items-center justify-center gap-2.5 p-3 text-center motion-reduce:transition-none",
              pending && "pointer-events-none opacity-70",
            )}
          >
            <span
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-full border-2 bg-white transition-colors duration-200",
                active
                  ? "border-primary bg-primary/10"
                  : "border-[var(--raksha-blue)] group-hover:border-primary/60",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition-colors duration-200",
                  active ? "text-primary" : "text-[var(--raksha-blue)] group-hover:text-primary",
                  pending && "animate-pulse",
                )}
                aria-hidden
              />
            </span>
            <span
              className={cn(
                "font-display text-[10px] font-bold uppercase leading-tight tracking-wide sm:text-[11px]",
                active
                  ? "text-primary"
                  : "text-[var(--raksha-blue-dark)] group-hover:text-[var(--raksha-blue)]",
              )}
            >
              {tile.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
