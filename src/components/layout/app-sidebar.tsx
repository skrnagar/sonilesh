"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Smartphone } from "lucide-react";
import {
  WORKSPACE_NAV,
  NAV_GROUP_LABELS,
  type AppModuleDef,
  type NavGroup,
} from "@/lib/navigation/workspace";
import { BrandLockup } from "@/components/brand/brand-lockup";
import { SidebarNavLink } from "@/components/layout/sidebar-nav-link";
import { cn } from "@/lib/utils";

const SIDEBAR_GROUPS: NavGroup[] = [
  "home",
  "dashboard",
  "safety_operations",
  "risk_control",
  "assurance",
  "people",
  "analytics",
  "reports",
  "ai",
  "administration",
];

function storageKey(group: string) {
  return `sonil-nav-collapsed-${group}`;
}

export function AppSidebar({
  enabledFeatures,
  permissions,
  organizationName,
}: {
  enabledFeatures: string[];
  permissions: string[];
  organizationName: string;
}) {
  const visible = WORKSPACE_NAV.filter((module) => {
    if (module.featureCode && !enabledFeatures.includes(module.featureCode)) {
      return false;
    }
    if (module.permission && !permissions.includes(module.permission)) {
      if (module.key === "dashboard" || module.key === "home") return true;
      return false;
    }
    return true;
  });

  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const initial: Record<string, boolean> = {};
    for (const group of SIDEBAR_GROUPS) {
      const stored = localStorage.getItem(storageKey(group));
      const groupItems = WORKSPACE_NAV.filter((m) => m.group === group);
      const defaultCollapsed =
        group === "administration" ||
        groupItems.some((m) => m.defaultCollapsed);
      initial[group] = stored === "0" ? false : stored === "1" ? true : defaultCollapsed;
    }
    setCollapsedGroups(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate collapsed state once on mount
  }, []);

  function toggleGroup(group: string) {
    setCollapsedGroups((prev) => {
      const next = { ...prev, [group]: !prev[group] };
      localStorage.setItem(storageKey(group), next[group] ? "1" : "0");
      return next;
    });
  }

  return (
    <aside className="flex h-dvh shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar/95 text-sidebar-foreground shadow-[1px_0_0_var(--sidebar-border)] backdrop-blur-sm">
      <div className="sidebar-brand flex items-center border-b border-sidebar-border px-3 py-3.5">
        <BrandLockup chrome size="sm" />
      </div>
      <p className="sidebar-copy truncate px-4 pb-2 pt-3 text-xs text-sidebar-muted" title={organizationName}>
        {organizationName}
      </p>
      <nav className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-2 py-2" aria-label="Workspace">
        {SIDEBAR_GROUPS.map((group) => {
          const items = visible.filter((m) => m.group === group);
          if (!items.length) return null;
          const isCollapsed = collapsedGroups[group] ?? false;
          const label = NAV_GROUP_LABELS[group];
          return (
            <div key={group} className="mb-2">
              <button
                type="button"
                onClick={() => toggleGroup(group)}
                className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-left transition-colors hover:bg-sidebar-accent/50"
                aria-expanded={!isCollapsed}
              >
                <span className="sidebar-copy text-[10px] font-semibold uppercase tracking-[0.14em] text-sidebar-muted">
                  {label}
                </span>
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 shrink-0 text-sidebar-muted transition-transform duration-200",
                    isCollapsed && "-rotate-90",
                  )}
                />
              </button>
              {!isCollapsed ? (
                <ul className="mt-0.5 space-y-0.5">
                  {items.map((item) => (
                    <li key={item.key}>
                      <SidebarNavLink href={item.href} label={item.label} icon={item.icon} />
                    </li>
                  ))}
                </ul>
              ) : null}
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

export function filterVisibleModules(
  modules: AppModuleDef[],
  enabledFeatures: string[],
  permissions: string[],
) {
  return modules.filter((module) => {
    if (module.featureCode && !enabledFeatures.includes(module.featureCode)) return false;
    if (module.permission && !permissions.includes(module.permission)) {
      if (module.key === "dashboard" || module.key === "home") return true;
      return false;
    }
    return true;
  });
}
