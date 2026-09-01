"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type RakshaGridTile = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  prefetch?: boolean;
};

export function RakshaLaunchpadGrid({ tiles }: { tiles: RakshaGridTile[] }) {
  const pathname = usePathname();
  const [pendingKey, setPendingKey] = useState<string | null>(null);

  useEffect(() => {
    setPendingKey(null);
  }, [pathname]);

  if (!tiles.length) return null;

  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 sm:gap-3">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const pending = pendingKey === tile.key;
        return (
          <Link
            key={tile.key}
            href={tile.href}
            prefetch={tile.prefetch}
            aria-busy={pending || undefined}
            onClick={() => setPendingKey(tile.key)}
            className={cn(
              "raksha-module-tile group flex min-h-[6.75rem] flex-col items-center justify-center gap-2 p-3 text-center motion-reduce:transition-none",
              pending && "pointer-events-none opacity-70",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--raksha-blue-light)]">
              <Icon
                className={cn(
                  "h-5 w-5 text-[var(--raksha-blue-dark)]",
                  pending && "animate-pulse",
                )}
                aria-hidden
              />
            </span>
            <span className="font-display text-[11px] font-semibold leading-tight text-[var(--raksha-blue-dark)] group-hover:text-[var(--raksha-blue)] sm:text-xs">
              {tile.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
