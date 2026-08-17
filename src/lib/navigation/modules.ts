export type AppModuleDef = {
  key: string;
  label: string;
  href: string;
  icon: string;
  featureCode?: string;
  permission?: string;
  group: "operations" | "assurance" | "support" | "insights" | "compliance" | "esg" | "system";
};

export const APP_MODULES: AppModuleDef[] = [
  { key: "dashboard", label: "Dashboard", href: "/app/dashboard", icon: "LayoutDashboard", permission: "dashboard.view", group: "operations" },
  { key: "notifications", label: "Notifications", href: "/app/notifications", icon: "Bell", permission: "dashboard.view", group: "operations" },
  { key: "new-report", label: "New report", href: "/app/reports/new", icon: "Inbox", permission: "incidents.create", group: "operations" },
  { key: "reporting-queue", label: "Reporting queue", href: "/app/reporting/queue", icon: "Inbox", permission: "incidents.view", group: "operations" },
  { key: "incidents", label: "Incidents", href: "/app/incidents", icon: "AlertTriangle", featureCode: "incident_management", permission: "incidents.view", group: "operations" },
  { key: "near-misses", label: "Near Misses", href: "/app/near-misses", icon: "ShieldAlert", featureCode: "near_miss", permission: "near_miss.view", group: "operations" },
  { key: "hazards", label: "Hazards", href: "/app/hazards", icon: "Eye", featureCode: "hazard_reporting", permission: "hazards.view", group: "operations" },
  { key: "observations", label: "Observations", href: "/app/observations", icon: "Eye", featureCode: "hazard_reporting", permission: "hazards.view", group: "operations" },
  { key: "risk-assessments", label: "Risk Assessments", href: "/app/risk-assessments", icon: "Grid2x2", featureCode: "risk_assessment", permission: "risk.view", group: "assurance" },
  { key: "risk-register", label: "Risk Register", href: "/app/risk-register", icon: "Grid2x2", featureCode: "risk_assessment", permission: "risk.view", group: "assurance" },
  { key: "jsa", label: "JSA", href: "/app/jsa", icon: "ListTree", featureCode: "jsa", permission: "risk.view", group: "assurance" },
  { key: "jha", label: "JHA", href: "/app/jha", icon: "ClipboardList", featureCode: "jha", permission: "risk.view", group: "assurance" },
  { key: "permits", label: "Permits", href: "/app/permits", icon: "FileBadge", featureCode: "permit_to_work", permission: "permits.view", group: "assurance" },
  { key: "permits-active", label: "Active Permits", href: "/app/permits/active", icon: "FileBadge", featureCode: "permit_to_work", permission: "permits.view", group: "assurance" },
  { key: "inspections", label: "Inspections", href: "/app/inspections", icon: "ClipboardCheck", featureCode: "inspections", permission: "inspections.view", group: "assurance" },
  { key: "audits", label: "Audits", href: "/app/audits", icon: "FileSearch", featureCode: "audits", permission: "audits.view", group: "assurance" },
  { key: "findings", label: "Findings", href: "/app/findings", icon: "ListChecks", featureCode: "inspections", permission: "findings.view", group: "assurance" },
  { key: "capa", label: "CAPA", href: "/app/capa", icon: "ListChecks", featureCode: "capa", permission: "capa.view", group: "assurance" },
  { key: "training", label: "Training", href: "/app/training", icon: "GraduationCap", featureCode: "training", group: "support" },
  { key: "contractors", label: "Contractors", href: "/app/contractors", icon: "HardHat", featureCode: "contractor_management", group: "support" },
  { key: "ppe", label: "PPE", href: "/app/ppe", icon: "Shield", featureCode: "ppe_management", group: "support" },
  { key: "chemicals", label: "Chemicals / SDS", href: "/app/chemicals", icon: "FlaskConical", featureCode: "chemical_sds", group: "support" },
  { key: "documents", label: "Documents", href: "/app/documents", icon: "Folder", featureCode: "document_control", group: "support" },
  { key: "moc", label: "MOC", href: "/app/moc", icon: "GitBranch", featureCode: "moc", group: "support" },
  { key: "expiry", label: "Expiry register", href: "/app/compliance/expiry", icon: "CalendarDays", permission: "documents.view", group: "support" },
  { key: "toolbox-talks", label: "Toolbox Talks", href: "/app/toolbox-talks", icon: "MessagesSquare", featureCode: "toolbox_talks", group: "support" },
  { key: "action-items", label: "Action Items", href: "/app/action-items", icon: "CheckSquare", featureCode: "capa", permission: "capa.view", group: "assurance" },
  { key: "reports", label: "Reports", href: "/app/reports", icon: "FileText", featureCode: "advanced_reports", permission: "reports.view", group: "insights" },
  { key: "analytics", label: "Analytics", href: "/app/analytics", icon: "BarChart3", featureCode: "advanced_analytics", permission: "analytics.view", group: "insights" },
  { key: "compliance-dashboard", label: "Compliance", href: "/app/compliance/dashboard", icon: "Scale", featureCode: "regulatory_compliance", permission: "compliance.view", group: "compliance" },
  { key: "compliance-calendar", label: "Filings calendar", href: "/app/compliance/calendar", icon: "CalendarDays", featureCode: "regulatory_compliance", permission: "compliance.view", group: "compliance" },
  { key: "legal-register", label: "Legal register", href: "/app/compliance/legal-register", icon: "Landmark", featureCode: "legal_register", permission: "legal_register.view", group: "compliance" },
  { key: "regulatory-licenses", label: "Licenses & consents", href: "/app/compliance/licenses", icon: "FileBadge", featureCode: "regulatory_compliance", permission: "regulatory_permits.view", group: "compliance" },
  { key: "compliance-assessments", label: "Compliance assessments", href: "/app/compliance/assessments", icon: "ClipboardCheck", featureCode: "regulatory_compliance", permission: "compliance.view", group: "compliance" },
  { key: "compliance-profile", label: "Applicability profile", href: "/app/settings/compliance-profile", icon: "Landmark", featureCode: "regulatory_compliance", permission: "compliance.manage", group: "compliance" },
  { key: "esg-dashboard", label: "ESG dashboard", href: "/app/esg/dashboard", icon: "Leaf", featureCode: "esg", permission: "esg.view", group: "esg" },
  { key: "esg-metrics", label: "ESG metrics", href: "/app/esg/metrics", icon: "Leaf", featureCode: "esg_reporting", permission: "esg.view", group: "esg" },
  { key: "esg-definitions", label: "Metric definitions", href: "/app/esg/definitions", icon: "ListChecks", featureCode: "esg", permission: "esg.view", group: "esg" },
  { key: "esg-ghg", label: "GHG inventory", href: "/app/esg/ghg-inventory", icon: "Leaf", featureCode: "esg_reporting", permission: "esg.view", group: "esg" },
  { key: "esg-epr", label: "EPR", href: "/app/esg/epr", icon: "Recycle", featureCode: "esg_reporting", permission: "esg.view", group: "esg" },
  { key: "esg-brsr", label: "BRSR report", href: "/app/esg/brsr-report", icon: "FileText", featureCode: "brsr", permission: "brsr.view", group: "esg" },
  { key: "esg-materiality", label: "Materiality", href: "/app/esg/materiality", icon: "Grid2x2", featureCode: "esg_reporting", permission: "esg.view", group: "esg" },
  { key: "esg-committee", label: "ESG committee", href: "/app/esg/committee", icon: "Users", featureCode: "esg_reporting", permission: "esg.view", group: "esg" },
  { key: "org-admin", label: "Org admin", href: "/app/admin", icon: "Building2", permission: "settings.manage", group: "system" },
  { key: "settings", label: "Settings", href: "/app/settings/organization", icon: "Settings", permission: "settings.manage", group: "system" },
  { key: "users", label: "Users", href: "/app/settings/users", icon: "Users", permission: "users.view", group: "system" },
  { key: "sites", label: "Sites", href: "/app/settings/sites", icon: "MapPin", permission: "sites.view", group: "system" },
  { key: "billing", label: "Billing", href: "/app/settings/billing", icon: "CreditCard", permission: "billing.view", group: "system" },
  { key: "subscription", label: "Subscription", href: "/app/settings/subscription", icon: "CreditCard", permission: "billing.view", group: "system" },
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
      { href: "/admin/obligations", label: "Obligation library", icon: "Scale" },
      { href: "/admin/settings", label: "Platform Settings", icon: "Settings" },
    ],
  },
] as const;
