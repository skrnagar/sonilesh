"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FIELD_NAV_ITEMS } from "@/lib/field/nav";
import { cn } from "@/lib/utils";

export function FieldDesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Field sections"
      className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex"
    >
      {FIELD_NAV_ITEMS.map((item) => {
        const active = item.match(pathname);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={item.prefetch}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm font-semibold transition-colors xl:px-3",
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
