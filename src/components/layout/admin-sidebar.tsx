import Link from "next/link";
import { ADMIN_NAV } from "@/lib/navigation/modules";
import { SidebarNavLink } from "@/components/layout/sidebar-nav-link";

export function AdminSidebar() {
  return (
    <aside className="flex h-screen w-60 shrink-0 flex-col border-r border-white/10 bg-[var(--mkt-hero)] text-white">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-xs font-bold">
            E
          </span>
          <div>
            <p className="text-sm font-semibold">EHS360 Admin</p>
            <p className="text-xs text-white/55">Platform owner console</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-0.5 px-2.5 py-3">
        {ADMIN_NAV.map((item) => (
          <SidebarNavLink key={item.href} href={item.href} label={item.label} />
        ))}
      </nav>
      <div className="border-t border-white/10 p-3">
        <Link
          href="/app/dashboard"
          className="block rounded-md px-2.5 py-2 text-xs text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          Back to customer app
        </Link>
      </div>
    </aside>
  );
}
