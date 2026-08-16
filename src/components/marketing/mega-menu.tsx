"use client";

import Link from "next/link";
import type { MegaColumn } from "@/lib/marketing/nav";
import { cn } from "@/lib/utils";

type MegaMenuProps = {
  columns: MegaColumn[];
  open: boolean;
  onNavigate?: () => void;
};

export function MegaMenu({ columns, open, onNavigate }: MegaMenuProps) {
  return (
    <div
      className={cn(
        "absolute left-1/2 top-full z-50 w-[min(36rem,calc(100vw-2rem))] -translate-x-1/2 pt-2 transition-[opacity,transform] duration-150 motion-reduce:transition-none xl:left-0 xl:w-auto xl:translate-x-0",
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-1 opacity-0 motion-reduce:translate-y-0",
      )}
    >
      <div className="overflow-hidden rounded-xl border border-border/80 bg-card/95 shadow-[var(--shadow-lg)] backdrop-blur-md">
        <div className="h-px bg-[linear-gradient(90deg,var(--mkt-safety),transparent_70%)]" />
        <div className="p-4 sm:p-5">
          <div
            className={cn(
              "grid gap-6",
              columns.length > 1 ? "grid-cols-2" : "grid-cols-1",
            )}
          >
            {columns.map((column) => (
              <div key={column.title}>
                <p className="mb-2 px-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {column.title}
                </p>
                <ul className="space-y-0.5">
                  {column.links.map((link) => (
                    <li key={link.href + link.label}>
                      <Link
                        href={link.href}
                        onClick={onNavigate}
                        className="block rounded-lg px-2.5 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
                      >
                        <span className="text-sm font-medium text-primary">
                          {link.label}
                        </span>
                        {link.description ? (
                          <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                            {link.description}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
