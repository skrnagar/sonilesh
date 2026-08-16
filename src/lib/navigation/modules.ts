export type AppModuleDef = {
  key: string;
  label: string;
  href: string;
  icon: string;
  featureCode?: string;
  permission?: string;
  group: "operations" | "assurance" | "support" | "insights" | "system";
};

export const APP_MODULES: AppModuleDef[] = [
  { key: "dashboard", label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard", permission: "dashboard.view", group: "operations" },
  { key: "incidents", label: "Incidents", href: "/app/incidents", icon: "AlertTriangle", featureCode: "incident_management", permission: "incidents.view", group: "operations" },
  { key: "near-misses", label: "Near Misses", href: "/app/near-misses", icon: "ShieldAlert", featureCode: "near_miss", permission: "near_miss.view", group: "operations" },
  { key: "hazards", label: "Hazards / UA / UC", href: "/app/hazards", icon: "Eye", featureCode: "hazard_reporting", permission: "hazards.view", group: "operations" },
  { key: "risk-assessments", label: "Risk Assessments", href: "/app/risk-assessments", icon: "Grid2x2", featureCode: "risk_assessment", group: "assurance" },
  { key: "jsa", label: "JSA", href: "/app/jsa", icon: "ListTree", featureCode: "jsa", group: "assurance" },
  { key: "jha", label: "JHA", href: "/app/jha", icon: "ClipboardList", featureCode: "jha", group: "assurance" },
  { key: "permits", label: "Permits", href: "/app/permits", icon: "FileBadge", featureCode: "permit_to_work", group: "assurance" },
  { key: "inspections", label: "Inspections", href: "/app/inspections", icon: "ClipboardCheck", featureCode: "inspections", group: "assurance" },
  { key: "audits", label: "Audits", href: "/app/audits", icon: "FileSearch", featureCode: "audits", group: "assurance" },
  { key: "capa", label: "CAPA", href: "/app/capa", icon: "ListChecks", featureCode: "capa", permission: "capa.view", group: "assurance" },
  { key: "training", label: "Training", href: "/app/training", icon: "GraduationCap", featureCode: "training", group: "support" },
  { key: "contractors", label: "Contractors", href: "/app/contractors", icon: "HardHat", featureCode: "contractor_management", group: "support" },
  { key: "ppe", label: "PPE", href: "/app/ppe", icon: "Shield", featureCode: "ppe_management", group: "support" },
  { key: "chemicals", label: "Chemicals / SDS", href: "/app/chemicals", icon: "FlaskConical", featureCode: "chemical_sds", group: "support" },
  { key: "documents", label: "Documents", href: "/app/documents", icon: "Folder", featureCode: "document_control", group: "support" },
  { key: "moc", label: "MOC", href: "/app/moc", icon: "GitBranch", featureCode: "moc", group: "support" },
  { key: "toolbox-talks", label: "Toolbox Talks", href: "/app/toolbox-talks", icon: "MessagesSquare", featureCode: "toolbox_talks", group: "support" },
  { key: "action-items", label: "Action Items", href: "/app/action-items", icon: "CheckSquare", featureCode: "capa", permission: "capa.view", group: "assurance" },
  { key: "reports", label: "Reports", href: "/app/reports", icon: "FileText", featureCode: "advanced_reports", permission: "reports.view", group: "insights" },
  { key: "analytics", label: "Analytics", href: "/app/analytics", icon: "BarChart3", featureCode: "advanced_analytics", permission: "analytics.view", group: "insights" },
  { key: "settings", label: "Settings", href: "/app/settings", icon: "Settings", permission: "settings.manage", group: "system" },
];

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/organizations", label: "Organizations" },
  { href: "/admin/plans", label: "Plans" },
  { href: "/admin/features", label: "Features" },
  { href: "/admin/users", label: "Platform Users" },
  { href: "/admin/support", label: "Support" },
  { href: "/admin/audit", label: "Audit Logs" },
  { href: "/admin/settings", label: "Platform Settings" },
  { href: "/admin/billing", label: "Billing Config" },
];

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
