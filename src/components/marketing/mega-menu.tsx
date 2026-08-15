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
        "absolute left-0 top-full z-50 pt-3 transition-[opacity,transform] duration-150 motion-reduce:transition-none",
        open
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none -translate-y-1 opacity-0 motion-reduce:translate-y-0",
      )}
    >
      <div className="min-w-[440px] rounded-lg border border-border bg-card p-5 shadow-[var(--shadow-lg)]">
        <div
          className={cn(
            "grid gap-6",
            columns.length > 1 ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {columns.map((column) => (
            <div key={column.title}>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {column.title}
              </p>
              <ul className="space-y-0.5">
                {column.links.map((link) => (
                  <li key={link.href + link.label}>
                    <Link
                      href={link.href}
                      onClick={onNavigate}
                      className="block rounded-md px-2.5 py-2 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
  );
}
