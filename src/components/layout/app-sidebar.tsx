import Link from "next/link";
import { APP_MODULES } from "@/lib/navigation/modules";
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
    { key: "operations", label: "Operations" },
    { key: "assurance", label: "Assurance" },
    { key: "support", label: "Support programs" },
    { key: "insights", label: "Insights" },
    { key: "system", label: "System" },
  ] as const;

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-white/10 bg-sidebar text-sidebar-foreground">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-xs font-bold text-white">
            E
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-white">EHS360</p>
            <p className="truncate text-xs text-white/60">{organizationName}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto px-2.5 py-3">
        {groups.map((group) => {
          const items = visible.filter((m) => m.group === group.key);
          if (!items.length) return null;
          return (
            <div key={group.key} className="mb-4">
              <p className="px-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
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
      <div className="border-t border-white/10 p-3">
        <Link
          href="/field"
          className="block rounded-md bg-[var(--mkt-safety)] px-3 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#0d6b63]"
        >
          Open Field app
        </Link>
      </div>
    </aside>
  );
}
