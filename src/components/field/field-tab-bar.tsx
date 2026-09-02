"use client";

import { usePathname } from "next/navigation";
import { FieldNavLink } from "@/components/field/field-nav-link";
import { FIELD_NAV_ITEMS, FIELD_SHELL_CLASS } from "@/lib/field/nav";
import { cn } from "@/lib/utils";

export function FieldTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Field"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border/80 bg-card/95 pb-[max(0.35rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgba(11,58,83,0.18)] backdrop-blur-md lg:hidden"
    >
      <div className={cn(FIELD_SHELL_CLASS, "grid grid-cols-5 gap-0.5 pt-1.5")}>
        {FIELD_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <FieldNavLink
              key={item.href}
              item={item}
              pathname={pathname}
              activeClassName="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-0.5 text-[10px] font-semibold leading-none transition-[background-color,color,box-shadow] duration-200 bg-primary text-white shadow-[var(--shadow-sm)] dark:text-[#071f2d]"
              inactiveClassName="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-0.5 text-[10px] font-semibold leading-none transition-[background-color,color,box-shadow] duration-200 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="max-w-full truncate">{item.label}</span>
            </FieldNavLink>
          );
        })}
      </div>
    </nav>
  );
}
