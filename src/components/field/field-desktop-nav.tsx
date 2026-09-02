"use client";

import { usePathname } from "next/navigation";
import { FieldNavLink } from "@/components/field/field-nav-link";
import { FIELD_NAV_ITEMS } from "@/lib/field/nav";

export function FieldDesktopNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Field sections"
      className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 lg:flex"
    >
      {FIELD_NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <FieldNavLink
            key={item.href}
            item={item}
            pathname={pathname}
            activeClassName="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm font-semibold transition-colors xl:px-3 bg-primary/10 text-primary"
            inactiveClassName="inline-flex min-h-10 items-center gap-1.5 rounded-[var(--radius-sm)] px-2.5 text-sm font-semibold transition-colors xl:px-3 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            <span className="truncate">{item.label}</span>
          </FieldNavLink>
        );
      })}
    </nav>
  );
}
