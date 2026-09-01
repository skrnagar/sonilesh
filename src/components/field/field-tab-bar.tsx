"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
          const active = item.match(pathname);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={item.prefetch}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-[var(--radius-sm)] px-0.5 text-[10px] font-semibold leading-none transition-[background-color,color,box-shadow] duration-200",
                active
                  ? "bg-primary text-white shadow-[var(--shadow-sm)] dark:text-[#071f2d]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" aria-hidden />
              <span className="max-w-full truncate">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
