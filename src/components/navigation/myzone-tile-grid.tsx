"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Heart, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const FAVORITES_STORAGE_KEY = "sonil-myzone-favorites";

export type MyZoneGridTile = {
  key: string;
  label: string;
  href: string;
  prefetch?: boolean;
};

type MyZoneTileGridProps = {
  tiles: MyZoneGridTile[];
  icons: Record<string, LucideIcon>;
  favoritesKey?: string;
  showFavorites?: boolean;
  columns?: "hub" | "subhub";
};

function readFavorites(storageKey: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as string[];
    return new Set(parsed);
  } catch {
    return new Set();
  }
}

export function MyZoneTileGrid({
  tiles,
  icons,
  favoritesKey = FAVORITES_STORAGE_KEY,
  showFavorites = true,
  columns = "hub",
}: MyZoneTileGridProps) {
  const pathname = usePathname();
  const [pendingKey, setPendingKey] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    setFavorites(readFavorites(favoritesKey));
  }, [favoritesKey]);

  useEffect(() => {
    setPendingKey(null);
  }, [pathname]);

  const toggleFavorite = useCallback(
    (key: string) => {
      setFavorites((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        window.localStorage.setItem(favoritesKey, JSON.stringify([...next]));
        return next;
      });
    },
    [favoritesKey],
  );

  if (!tiles.length) return null;

  const gridClass =
    columns === "subhub"
      ? "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4"
      : "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 lg:gap-4";

  const sortedTiles = [...tiles].sort((a, b) => {
    const aFav = favorites.has(a.key);
    const bFav = favorites.has(b.key);
    if (aFav === bFav) return 0;
    return aFav ? -1 : 1;
  });

  return (
    <div className={gridClass}>
      {sortedTiles.map((tile) => {
        const Icon = icons[tile.key];
        const pending = pendingKey === tile.key;
        const active =
          tile.href === "/field"
            ? pathname === "/field" || pathname === "/field/home"
            : pathname === tile.href || pathname.startsWith(`${tile.href}/`);
        const favorited = favorites.has(tile.key);

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
              "myzone-tile group relative flex aspect-square flex-col items-center justify-center gap-2.5 p-3 text-center motion-reduce:transition-none",
              pending && "pointer-events-none opacity-70",
            )}
          >
            {showFavorites ? (
              <button
                type="button"
                aria-label={favorited ? `Remove ${tile.label} from favorites` : `Favorite ${tile.label}`}
                aria-pressed={favorited}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  toggleFavorite(tile.key);
                }}
                className={cn(
                  "absolute right-2 top-2 rounded-full p-1 transition-colors",
                  favorited
                    ? "text-rose-500"
                    : "text-slate-300 opacity-0 hover:text-rose-400 group-hover:opacity-100",
                )}
              >
                <Heart className={cn("h-3.5 w-3.5", favorited && "fill-current")} />
              </button>
            ) : null}
            <span
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-white shadow-sm ring-1 ring-slate-200/80 transition-transform duration-200 group-hover:scale-105",
                active && "ring-2 ring-[var(--raksha-blue)]",
              )}
            >
              {Icon ? (
                <Icon
                  className={cn(
                    "h-6 w-6 text-[var(--raksha-blue)]",
                    pending && "animate-pulse",
                  )}
                  aria-hidden
                />
              ) : null}
            </span>
            <span
              className={cn(
                "px-1 font-display text-[11px] font-semibold leading-tight text-[var(--raksha-blue-dark)] sm:text-xs",
                active && "text-[var(--raksha-blue)]",
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
