import Link from "next/link";
import { ADMIN_NAV_GROUPS } from "@/lib/navigation/modules";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { SidebarNavLink } from "@/components/layout/sidebar-nav-link";
import {
  ADMIN_HREF_PERMISSION,
  hasPlatformPermission,
  type PlatformRole,
} from "@/lib/auth/platform";

export function AdminSidebar({ platformRole }: { platformRole: PlatformRole | null }) {
  return (
    <aside className="flex h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      <div className="sidebar-brand flex items-center border-b border-sidebar-border px-3 py-3.5">
        <BrandLockup chrome size="sm" />
      </div>
      <p className="sidebar-copy px-4 pb-2 pt-3 text-xs text-sidebar-muted">Admin console</p>
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2" aria-label="Administration">
        {ADMIN_NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => {
            const permission = ADMIN_HREF_PERMISSION[item.href];
            if (!permission) return true;
            return hasPlatformPermission(platformRole, permission);
          });
          if (!items.length) return null;
          return (
            <div key={group.label} className="mb-3">
              <p className="sidebar-copy px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <SidebarNavLink href={item.href} label={item.label} icon={item.icon} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-sidebar-border p-2.5">
        <Link
          href="/app/dashboard"
          title="Back to customer app"
          className="sidebar-nav-link flex items-center rounded-xl px-2.5 py-2 text-xs text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="sidebar-copy">Back to customer app</span>
          <span className="sidebar-glyph-collapsed mx-auto h-8 w-8 items-center justify-center text-[11px] font-semibold">
            App
          </span>
        </Link>
      </div>
    </aside>
  );
}
