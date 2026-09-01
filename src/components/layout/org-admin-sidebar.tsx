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

export function OrgAdminSidebar({ organizationName }: { organizationName: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[1px_0_0_var(--sidebar-border)] backdrop-blur-sm">
      <div className="sidebar-brand border-b border-sidebar-border px-3 py-3.5">
        <p className="text-sm font-semibold tracking-tight">Org Admin</p>
        <p className="mt-0.5 truncate text-xs text-sidebar-muted">{organizationName}</p>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-3" aria-label="Organization admin">
        <ul className="space-y-0.5">
          {ORG_ADMIN_NAV.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/org-admin/general" && pathname.startsWith(`${item.href}/`)) ||
              (item.href === "/org-admin/general" &&
                (pathname === "/org-admin" || pathname === "/org-admin/general"));
            const Icon = ICONS[item.icon as keyof typeof ICONS];
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-2.5">
        <Link
          href="/app/home"
          className="flex items-center rounded-xl px-2.5 py-2 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          Back to EHS workspace
        </Link>
      </div>
    </aside>
  );
}
