"use client";

import Link from "next/link";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { SidebarNavLink } from "@/components/layout/sidebar-nav-link";
import { FILES_NAV } from "@/lib/navigation/files";

export function FilesSidebar({ organizationName }: { organizationName: string }) {
  return (
    <aside className="flex h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[1px_0_0_var(--sidebar-border)] backdrop-blur-sm">
      <div className="sidebar-brand flex items-center border-b border-sidebar-border px-3 py-3.5">
        <BrandLockup chrome size="sm" />
      </div>
      <p className="sidebar-copy px-4 pb-2 pt-3 text-xs font-medium text-sidebar-muted">
        Files & Data
      </p>
      <p className="sidebar-copy truncate px-4 pb-2 text-[11px] text-sidebar-muted">
        {organizationName}
      </p>
      <nav className="min-h-0 flex-1 overflow-y-auto px-2 py-2" aria-label="Files and data">
        <ul className="space-y-0.5">
          {FILES_NAV.map((item) => (
            <li key={item.href}>
              <SidebarNavLink href={item.href} label={item.label} icon={item.icon} />
            </li>
          ))}
        </ul>
      </nav>
      <div className="border-t border-sidebar-border p-2.5">
        <Link
          href="/app/home"
          className="sidebar-nav-link flex items-center rounded-xl px-2.5 py-2 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
        >
          <span className="sidebar-copy">Back to EHS workspace</span>
        </Link>
      </div>
    </aside>
  );
}
