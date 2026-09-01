/** Platform admin console navigation — loaded only by /admin layout. */
export const ADMIN_NAV_GROUPS = [
  { label: "Menu", items: [{ href: "/admin", label: "Dashboard", icon: "LayoutDashboard" }] },
  {
    label: "Tenants",
    items: [
      { href: "/admin/organizations", label: "Organizations", icon: "Building2" },
      { href: "/admin/users", label: "Platform Users", icon: "Users" },
    ],
  },
  {
    label: "Commercial",
    items: [
      { href: "/admin/plans", label: "Plans", icon: "CreditCard" },
      { href: "/admin/features", label: "Features", icon: "Puzzle" },
      { href: "/admin/subscriptions", label: "Subscriptions", icon: "CreditCard" },
      { href: "/admin/entitlements", label: "Entitlements", icon: "Puzzle" },
      { href: "/admin/usage", label: "Usage", icon: "BarChart3" },
      { href: "/admin/billing", label: "Billing Config", icon: "CreditCard" },
    ],
  },
  {
    label: "Governance",
    items: [
      { href: "/admin/support", label: "Support", icon: "LifeBuoy" },
      { href: "/admin/audit", label: "Audit Logs", icon: "ScrollText" },
      { href: "/admin/settings", label: "Platform Settings", icon: "Settings" },
    ],
  },
] as const;

/** @deprecated Use ADMIN_NAV_GROUPS */
export const ADMIN_NAV = ADMIN_NAV_GROUPS.flatMap((g) =>
  g.items.map((item) => ({ href: item.href, label: item.label })),
);
