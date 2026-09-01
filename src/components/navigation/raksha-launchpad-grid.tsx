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
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 lg:gap-4 xl:grid-cols-5">
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
              "raksha-module-tile group flex min-h-[6.75rem] flex-col items-center justify-center gap-2.5 p-3 text-center motion-reduce:transition-none",
              pending && "pointer-events-none opacity-70",
            )}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-[var(--raksha-blue)] bg-white"
            >
              <Icon
                className={cn(
                  "h-5 w-5 text-[var(--raksha-blue)]",
                  pending && "animate-pulse",
                )}
                aria-hidden
              />
            </span>
            <span className="font-display text-[10px] font-bold uppercase leading-tight tracking-wide text-[var(--raksha-blue-dark)] group-hover:text-[var(--raksha-blue)] sm:text-[11px]">
              {tile.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
