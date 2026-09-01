"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FIELD_NAV_ITEMS } from "@/lib/field/nav";
import { cn } from "@/lib/utils";

export function FieldDesktopNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Field sections" className="hidden border-t border-white/10 lg:block">
      <div className="flex flex-wrap items-center gap-1 py-2">
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
                "inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/75 hover:bg-white/10 hover:text-white",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
