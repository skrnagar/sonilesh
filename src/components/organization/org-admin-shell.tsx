"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CreditCard,
  Database,
  Palette,
  Shield,
  Users,
} from "lucide-react";
import { ORG_ADMIN_NAV } from "@/lib/navigation/org-admin";
import { cn } from "@/lib/utils";

const ICONS = {
  Building2,
  Palette,
  Users,
  Shield,
  CreditCard,
  Database,
} as const;

/** Inline org admin nav for embedded contexts (prefer /org-admin app shell). */
export function OrgAdminShell({
  organizationName,
  children,
}: {
  organizationName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      <aside className="shrink-0 lg:w-56">
        <div className="mb-4 hidden lg:block">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Organization
          </p>
          <p className="mt-1 truncate text-sm font-semibold">{organizationName}</p>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0"
          aria-label="Organization admin"
        >
          {ORG_ADMIN_NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = ICONS[item.icon as keyof typeof ICONS];
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
