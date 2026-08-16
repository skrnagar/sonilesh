import Link from "next/link";
import { APP_MODULES } from "@/lib/navigation/modules";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { SidebarNavLink } from "@/components/layout/sidebar-nav-link";

export function AppSidebar({
  enabledFeatures,
  permissions,
  organizationName,
}: {
  enabledFeatures: string[];
  permissions: string[];
  organizationName: string;
}) {
  const visible = APP_MODULES.filter((module) => {
    if (module.featureCode && !enabledFeatures.includes(module.featureCode)) {
      return false;
    }
    if (module.permission && !permissions.includes(module.permission)) {
      if (module.key === "dashboard") return true;
      return false;
    }
    return true;
  });

  const groups = [
    { key: "operations", label: "Menu" },
    { key: "assurance", label: "Assurance" },
    { key: "support", label: "Programs" },
    { key: "insights", label: "Insights" },
    { key: "system", label: "System" },
  ] as const;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col overflow-hidden border-r border-[var(--sidebar-border)] bg-sidebar text-sidebar-foreground">
      <div className="border-b border-[var(--sidebar-border)] px-4 py-4">
        <BrandLockup chrome size="sm" />
        <p className="sidebar-copy mt-2 truncate text-xs text-[var(--sidebar-muted)]">
          {organizationName}
        </p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {groups.map((group) => {
          const items = visible.filter((m) => m.group === group.key);
          if (!items.length) return null;
          return (
            <div key={group.key} className="mb-4">
              <p className="sidebar-copy px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--sidebar-muted)]">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.key}>
                    <SidebarNavLink href={item.href} label={item.label} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="border-t border-[var(--sidebar-border)] p-3">
        <Link
          href="/field"
          className="block rounded-xl bg-[var(--mkt-safety)] px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:opacity-90"
        >
          <span className="sidebar-copy">Open Field app</span>
          <span className="sidebar-glyph mx-auto h-8 w-8 items-center justify-center text-xs">
            F
          </span>
        </Link>
      </div>
    </aside>
  );
}
