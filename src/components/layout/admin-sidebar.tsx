import Link from "next/link";
import { ADMIN_NAV_GROUPS } from "@/lib/navigation/modules";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { SidebarNavLink } from "@/components/layout/sidebar-nav-link";

export function AdminSidebar() {
  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-sidebar text-sidebar-foreground">
      <div className="border-b border-[var(--sidebar-border)] px-4 py-4">
        <BrandLockup chrome size="sm" />
        <p className="sidebar-copy mt-1.5 text-xs text-[var(--sidebar-muted)]">Admin console</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {ADMIN_NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="sidebar-copy px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--sidebar-muted)]">
              {group.label}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <SidebarNavLink href={item.href} label={item.label} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-[var(--sidebar-border)] p-3">
        <Link
          href="/app/dashboard"
          className="sidebar-copy block rounded-xl px-2.5 py-2 text-xs text-[var(--sidebar-muted)] transition-colors hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"
        >
          Back to customer app
        </Link>
      </div>
    </aside>
  );
}
