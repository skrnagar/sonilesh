/** Organization admin portal navigation — tenant branding, team, plan, domain. */
export const ORG_ADMIN_NAV = [
  { href: "/org-admin/general", label: "General", icon: "Building2" },
  { href: "/org-admin/branding", label: "Branding", icon: "Palette" },
  { href: "/org-admin/team", label: "Team", icon: "Users" },
  { href: "/org-admin/access", label: "Access", icon: "Shield" },
  { href: "/org-admin/plan", label: "Plan", icon: "CreditCard" },
  { href: "/org-admin/data", label: "Data", icon: "Database" },
] as const;

export const ORG_ADMIN_PATHS = [
  "/org-admin",
  ...ORG_ADMIN_NAV.map((item) => item.href),
  "/org-admin/team/invite",
  "/app/settings/organization/general",
  "/app/settings/organization/branding",
  "/app/settings/organization/team",
  "/app/settings/organization/access",
  "/app/settings/organization/plan",
  "/app/settings/organization/data",
];
