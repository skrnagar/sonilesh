import Link from "next/link";
import { Smartphone } from "lucide-react";
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
    { key: "compliance", label: "Compliance" },
    { key: "esg", label: "ESG / BRSR" },
    { key: "system", label: "System" },
  ] as const;

  return (
    <aside className="flex h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[1px_0_0_var(--sidebar-border)] backdrop-blur-sm">
      <div className="sidebar-brand flex items-center border-b border-sidebar-border px-3 py-3.5">
        <BrandLockup chrome size="sm" />
      </div>
      <p className="sidebar-copy truncate px-4 pb-2 pt-3 text-xs text-sidebar-muted" title={organizationName}>
        {organizationName}
      </p>
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2" aria-label="Workspace">
        {groups.map((group) => {
          const items = visible.filter((m) => m.group === group.key);
          if (!items.length) return null;
          return (
            <div key={group.key} className="mb-3.5">
              <p className="sidebar-copy px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.key}>
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
          href="/field"
          title="Open Field app"
          className="flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] bg-[var(--mkt-safety)] px-3 py-2.5 text-sm font-semibold text-[var(--mkt-safety-ink)] shadow-[var(--shadow-sm)] transition-[background-color,box-shadow,transform] duration-200 hover:bg-[var(--mkt-safety-hover)] hover:shadow-[var(--shadow-md)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:active:scale-100"
        >
          <Smartphone className="h-4 w-4 shrink-0" />
          <span className="sidebar-copy">Open Field app</span>
        </Link>
      </div>
    </aside>
  );
}
