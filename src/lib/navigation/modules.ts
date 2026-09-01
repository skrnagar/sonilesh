export type NavGroup =
  | "home"
  | "dashboard"
  | "safety_operations"
  | "risk_control"
  | "assurance"
  | "people"
  | "analytics"
  | "reports"
  | "ai"
  | "administration";

export type AppModuleDef = {
  key: string;
  label: string;
  href: string;
  icon: string;
  featureCode?: string;
  permission?: string;
  group: NavGroup;
  /** Collapsed by default in sidebar (compliance/ESG add-ons) */
  defaultCollapsed?: boolean;
};

export const NAV_GROUP_LABELS: Record<NavGroup, string> = {
  home: "Home",
  dashboard: "Dashboard",
  safety_operations: "Safety Operations",
  risk_control: "Risk & Control",
  assurance: "Assurance",
  people: "People",
  analytics: "Analytics",
  reports: "Reports",
  ai: "AI Copilot",
  administration: "Administration",
};

/** Enterprise information architecture — replaces flat 58-item APP_MODULES */
export const ENTERPRISE_NAV: AppModuleDef[] = [
  { key: "home", label: "Home", href: "/app/home", icon: "Home", permission: "dashboard.view", group: "home" },
  { key: "dashboard", label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard", permission: "dashboard.view", group: "dashboard" },
  { key: "notifications", label: "Notifications", href: "/app/notifications", icon: "Bell", permission: "dashboard.view", group: "dashboard" },

  // Safety Operations
  { key: "observations", label: "UA / UC", href: "/app/observations", icon: "Eye", featureCode: "hazard_reporting", permission: "hazards.view", group: "safety_operations" },
  { key: "incidents", label: "Incidents", href: "/app/incidents", icon: "AlertTriangle", featureCode: "incident_management", permission: "incidents.view", group: "safety_operations" },
  { key: "near-misses", label: "Near Misses", href: "/app/near-misses", icon: "ShieldAlert", featureCode: "near_miss", permission: "near_miss.view", group: "safety_operations" },
  { key: "hazards", label: "Hazards", href: "/app/hazards", icon: "TriangleAlert", featureCode: "hazard_reporting", permission: "hazards.view", group: "safety_operations" },
  { key: "lmra", label: "LMRA", href: "/app/lmra", icon: "ClipboardCheck", permission: "lmra.view", group: "safety_operations" },
  { key: "site-visits", label: "Site Visits", href: "/app/site-visits", icon: "MapPin", permission: "visits.view", group: "safety_operations" },
  { key: "reporting-queue", label: "Reporting queue", href: "/app/reporting/queue", icon: "Inbox", permission: "incidents.view", group: "safety_operations" },
  { key: "new-report", label: "New report", href: "/app/reports/new", icon: "PlusCircle", permission: "incidents.create", group: "safety_operations" },

  // Risk & Control
  { key: "permits", label: "Permits", href: "/app/permits", icon: "FileBadge", featureCode: "permit_to_work", permission: "permits.view", group: "risk_control" },
  { key: "permits-active", label: "Active Permits", href: "/app/permits/active", icon: "FileBadge", featureCode: "permit_to_work", permission: "permits.view", group: "risk_control" },
  { key: "risk-assessments", label: "Risk Assessments", href: "/app/risk-assessments", icon: "Grid2x2", featureCode: "risk_assessment", permission: "risk.view", group: "risk_control" },
  { key: "risk-register", label: "Risk Register", href: "/app/risk-register", icon: "Grid2x2", featureCode: "risk_assessment", permission: "risk.view", group: "risk_control" },
  { key: "jsa", label: "JSA", href: "/app/jsa", icon: "ListTree", featureCode: "jsa", permission: "risk.view", group: "risk_control" },
  { key: "jha", label: "JHA", href: "/app/jha", icon: "ClipboardList", featureCode: "jha", permission: "risk.view", group: "risk_control" },
  { key: "chemicals", label: "Chemicals / SDS", href: "/app/chemicals", icon: "FlaskConical", featureCode: "chemical_sds", group: "risk_control" },
  { key: "moc", label: "MOC", href: "/app/moc", icon: "GitBranch", featureCode: "moc", group: "risk_control" },

  // Assurance
  { key: "inspections", label: "Inspections", href: "/app/inspections", icon: "ClipboardCheck", featureCode: "inspections", permission: "inspections.view", group: "assurance" },
  { key: "audits", label: "Audits", href: "/app/audits", icon: "FileSearch", featureCode: "audits", permission: "audits.view", group: "assurance" },
  { key: "findings", label: "Findings", href: "/app/findings", icon: "ListChecks", featureCode: "inspections", permission: "findings.view", group: "assurance" },
  { key: "capa", label: "CAPA", href: "/app/capa", icon: "ListChecks", featureCode: "capa", permission: "capa.view", group: "assurance" },
  { key: "action-items", label: "Action Items", href: "/app/action-items", icon: "CheckSquare", featureCode: "capa", permission: "capa.view", group: "assurance" },
  { key: "ppe", label: "PPE", href: "/app/ppe", icon: "Shield", featureCode: "ppe_management", group: "assurance" },
  { key: "documents", label: "Documents", href: "/app/documents", icon: "Folder", featureCode: "document_control", group: "assurance" },

  // People
  { key: "training", label: "Training", href: "/app/training", icon: "GraduationCap", featureCode: "training", group: "people" },
  { key: "contractors", label: "Contractors", href: "/app/contractors", icon: "HardHat", featureCode: "contractor_management", group: "people" },
  { key: "toolbox-talks", label: "Toolbox Talks", href: "/app/toolbox-talks", icon: "MessagesSquare", featureCode: "toolbox_talks", group: "people" },

  // Analytics
  { key: "analytics", label: "Analytics", href: "/app/analytics", icon: "BarChart3", featureCode: "advanced_analytics", permission: "analytics.view", group: "analytics" },
  { key: "executive", label: "Control Tower", href: "/app/executive", icon: "LayoutDashboard", featureCode: "executive_analytics", permission: "analytics.view", group: "analytics" },
  { key: "ehs-score", label: "EHS Scorecard", href: "/app/ehs-score", icon: "Gauge", permission: "score.view", group: "analytics" },
  { key: "alerts", label: "Alerts", href: "/app/alerts", icon: "Bell", featureCode: "advanced_analytics", permission: "analytics.view", group: "analytics" },

  // Reports
  { key: "report-hub", label: "Report Hub", href: "/app/reports/hub", icon: "FileText", featureCode: "advanced_reports", permission: "reports.view", group: "reports" },
  { key: "mis", label: "EHS MIS", href: "/app/mis", icon: "FileSpreadsheet", permission: "mis.view", group: "reports" },
  { key: "reports", label: "Reports", href: "/app/reports", icon: "FileText", featureCode: "advanced_reports", permission: "reports.view", group: "reports" },

  // AI Copilot
  { key: "ai-copilot", label: "EHS Copilot", href: "/app/ai", icon: "Sparkles", featureCode: "ai_copilot", permission: "ai.use", group: "ai" },
  { key: "ai-actions", label: "AI suggestions", href: "/app/ai/actions", icon: "Sparkles", featureCode: "ai_copilot", permission: "ai.approve", group: "ai" },
  { key: "search", label: "Search", href: "/app/search", icon: "Search", featureCode: "enterprise_search", permission: "search.use", group: "ai" },

  // Administration (collapsed compliance/ESG as secondary)
  { key: "settings", label: "Settings", href: "/app/settings/organization", icon: "Settings", permission: "settings.manage", group: "administration" },
  { key: "users", label: "Users", href: "/app/settings/users", icon: "Users", permission: "users.view", group: "administration" },
  { key: "regions", label: "Regions", href: "/app/settings/regions", icon: "Globe", permission: "settings.manage", group: "administration" },
  { key: "sites", label: "Sites", href: "/app/settings/sites", icon: "MapPin", permission: "sites.view", group: "administration" },
  { key: "integrations", label: "Integrations", href: "/app/integrations", icon: "Puzzle", featureCode: "integrations", permission: "integrations.view", group: "administration" },
  { key: "marketplace", label: "Templates", href: "/app/marketplace", icon: "Store", featureCode: "marketplace", permission: "marketplace.view", group: "administration" },
  { key: "import", label: "Import", href: "/app/import", icon: "Inbox", permission: "import.manage", group: "administration" },
  { key: "billing", label: "Billing", href: "/app/settings/billing", icon: "CreditCard", permission: "billing.view", group: "administration" },
  // Compliance / ESG — secondary, collapsed
  { key: "compliance-dashboard", label: "Compliance", href: "/app/compliance/dashboard", icon: "Scale", featureCode: "regulatory_compliance", permission: "compliance.view", group: "administration", defaultCollapsed: true },
  { key: "esg-dashboard", label: "ESG", href: "/app/esg/dashboard", icon: "Leaf", featureCode: "esg", permission: "esg.view", group: "administration", defaultCollapsed: true },
];

/** @deprecated Use ENTERPRISE_NAV — kept for backward compatibility */
export const APP_MODULES = ENTERPRISE_NAV;

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
