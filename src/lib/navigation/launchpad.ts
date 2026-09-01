import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  Bot,
  CheckSquare,
  ClipboardCheck,
  ClipboardList,
  Eye,
  FileBadge,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FlaskConical,
  Folder,
  Gauge,
  GitBranch,
  GraduationCap,
  Grid2x2,
  HardHat,
  Inbox,
  LayoutDashboard,
  ListChecks,
  ListTree,
  MapPin,
  MessagesSquare,
  PlusCircle,
  Scale,
  Shield,
  ShieldAlert,
  Sparkles,
  Search,
  TriangleAlert,
} from "lucide-react";

export type LaunchpadSection = "dashboard" | "operations" | "reports" | "ai";

export type LaunchpadTile = {
  key: string;
  label: string;
  description: string;
  href: string;
  icon: LucideIcon;
  section: LaunchpadSection;
  featureCode?: string;
  permission?: string;
  accent?: "navy" | "teal" | "amber" | "red" | "slate";
  /** Role codes that see this tile in My Dashboard (others may still see it in Operations) */
  dashboardRoles?: string[];
};

/** Enterprise module launchpad — 20+ operational modules, RBAC-filtered */
export const LAUNCHPAD_TILES: LaunchpadTile[] = [
  // —— My Dashboard ——
  {
    key: "dashboard",
    label: "Dashboard",
    description: "Operational KPIs and trends",
    href: "/app/dashboard",
    icon: LayoutDashboard,
    section: "dashboard",
    permission: "dashboard.view",
    accent: "navy",
  },
  {
    key: "executive",
    label: "Control Tower",
    description: "Executive overview",
    href: "/app/executive",
    icon: LayoutDashboard,
    section: "dashboard",
    featureCode: "executive_analytics",
    permission: "analytics.view",
    accent: "navy",
    dashboardRoles: ["ehs_admin", "ehs_manager", "tenant_admin", "super_admin"],
  },
  {
    key: "my-actions",
    label: "My actions",
    description: "Assigned CAPA items",
    href: "/app/action-items",
    icon: CheckSquare,
    section: "dashboard",
    featureCode: "capa",
    permission: "capa.view",
    accent: "slate",
    dashboardRoles: ["employee", "supervisor", "site_manager"],
  },
  {
    key: "notifications",
    label: "Notifications",
    description: "Alerts and assignments",
    href: "/app/notifications",
    icon: Bell,
    section: "dashboard",
    permission: "dashboard.view",
    accent: "slate",
  },

  // —— EHS Operations ——
  {
    key: "ua-uc",
    label: "UA / UC",
    description: "Unsafe act or condition",
    href: "/app/observations",
    icon: Eye,
    section: "operations",
    featureCode: "hazard_reporting",
    permission: "hazards.view",
    accent: "teal",
  },
  {
    key: "incidents",
    label: "Incidents",
    description: "Injury and property damage",
    href: "/app/incidents",
    icon: AlertTriangle,
    section: "operations",
    featureCode: "incident_management",
    permission: "incidents.view",
    accent: "red",
  },
  {
    key: "near-misses",
    label: "Near miss",
    description: "Potential incidents",
    href: "/app/near-misses",
    icon: ShieldAlert,
    section: "operations",
    featureCode: "near_miss",
    permission: "near_miss.view",
    accent: "amber",
  },
  {
    key: "hazards",
    label: "Hazards",
    description: "Hazard register",
    href: "/app/hazards",
    icon: TriangleAlert,
    section: "operations",
    featureCode: "hazard_reporting",
    permission: "hazards.view",
    accent: "amber",
  },
  {
    key: "lmra",
    label: "LMRA",
    description: "Last minute risk assessment",
    href: "/app/lmra",
    icon: ClipboardCheck,
    section: "operations",
    permission: "lmra.view",
    accent: "navy",
  },
  {
    key: "site-visits",
    label: "Site visits",
    description: "HSV / RSV / TSV",
    href: "/app/site-visits",
    icon: MapPin,
    section: "operations",
    permission: "visits.view",
    accent: "teal",
  },
  {
    key: "reporting-queue",
    label: "Reporting queue",
    description: "Pending submissions",
    href: "/app/reporting/queue",
    icon: Inbox,
    section: "operations",
    permission: "incidents.view",
    accent: "amber",
    dashboardRoles: ["ehs_officer", "investigator"],
  },
  {
    key: "new-report",
    label: "New report",
    description: "Create any report type",
    href: "/app/reports/new",
    icon: PlusCircle,
    section: "operations",
    permission: "incidents.create",
    accent: "teal",
  },
  {
    key: "permits",
    label: "Permits",
    description: "Permit to work",
    href: "/app/permits",
    icon: FileBadge,
    section: "operations",
    featureCode: "permit_to_work",
    permission: "permits.view",
    accent: "navy",
  },
  {
    key: "permits-active",
    label: "Active permits",
    description: "Live PTW register",
    href: "/app/permits/active",
    icon: FileBadge,
    section: "operations",
    featureCode: "permit_to_work",
    permission: "permits.view",
    accent: "navy",
  },
  {
    key: "risk-assessments",
    label: "Risk assessments",
    description: "Formal risk analysis",
    href: "/app/risk-assessments",
    icon: Grid2x2,
    section: "operations",
    featureCode: "risk_assessment",
    permission: "risk.view",
    accent: "slate",
  },
  {
    key: "risk-register",
    label: "Risk register",
    description: "Organizational risk log",
    href: "/app/risk-register",
    icon: Grid2x2,
    section: "operations",
    featureCode: "risk_assessment",
    permission: "risk.view",
    accent: "slate",
  },
  {
    key: "jsa",
    label: "JSA",
    description: "Job safety analysis",
    href: "/app/jsa",
    icon: ListTree,
    section: "operations",
    featureCode: "jsa",
    permission: "risk.view",
    accent: "slate",
  },
  {
    key: "jha",
    label: "JHA",
    description: "Job hazard analysis",
    href: "/app/jha",
    icon: ClipboardList,
    section: "operations",
    featureCode: "jha",
    permission: "risk.view",
    accent: "slate",
  },
  {
    key: "inspections",
    label: "Inspections",
    description: "Scheduled inspections",
    href: "/app/inspections",
    icon: ClipboardCheck,
    section: "operations",
    featureCode: "inspections",
    permission: "inspections.view",
    accent: "teal",
  },
  {
    key: "audits",
    label: "Audits",
    description: "Audit programs",
    href: "/app/audits",
    icon: FileSearch,
    section: "operations",
    featureCode: "audits",
    permission: "audits.view",
    accent: "navy",
  },
  {
    key: "findings",
    label: "Findings",
    description: "Open audit findings",
    href: "/app/findings",
    icon: ListChecks,
    section: "operations",
    featureCode: "inspections",
    permission: "findings.view",
    accent: "amber",
  },
  {
    key: "capa",
    label: "CAPA",
    description: "Corrective actions",
    href: "/app/capa",
    icon: ListChecks,
    section: "operations",
    featureCode: "capa",
    permission: "capa.view",
    accent: "slate",
  },
  {
    key: "action-items",
    label: "Action items",
    description: "Assigned tasks",
    href: "/app/action-items",
    icon: CheckSquare,
    section: "operations",
    featureCode: "capa",
    permission: "capa.view",
    accent: "slate",
  },
  {
    key: "ppe",
    label: "PPE",
    description: "PPE inventory",
    href: "/app/ppe",
    icon: Shield,
    section: "operations",
    featureCode: "ppe_management",
    accent: "slate",
  },
  {
    key: "documents",
    label: "Documents",
    description: "Controlled documents",
    href: "/app/documents",
    icon: Folder,
    section: "operations",
    featureCode: "document_control",
    accent: "slate",
  },
  {
    key: "training",
    label: "Training",
    description: "Competency and courses",
    href: "/app/training",
    icon: GraduationCap,
    section: "operations",
    featureCode: "training",
    accent: "teal",
  },
  {
    key: "contractors",
    label: "Contractors",
    description: "Contractor management",
    href: "/app/contractors",
    icon: HardHat,
    section: "operations",
    featureCode: "contractor_management",
    accent: "navy",
  },
  {
    key: "toolbox-talks",
    label: "Toolbox talks",
    description: "Safety briefings",
    href: "/app/toolbox-talks",
    icon: MessagesSquare,
    section: "operations",
    featureCode: "toolbox_talks",
    accent: "teal",
  },
  {
    key: "chemicals",
    label: "Chemicals / SDS",
    description: "Chemical inventory",
    href: "/app/chemicals",
    icon: FlaskConical,
    section: "operations",
    featureCode: "chemical_sds",
    accent: "slate",
  },
  {
    key: "moc",
    label: "MOC",
    description: "Management of change",
    href: "/app/moc",
    icon: GitBranch,
    section: "operations",
    featureCode: "moc",
    accent: "slate",
  },
  {
    key: "compliance",
    label: "Compliance",
    description: "Regulatory obligations",
    href: "/app/compliance/dashboard",
    icon: Scale,
    section: "operations",
    featureCode: "regulatory_compliance",
    permission: "compliance.view",
    accent: "slate",
  },

  // —— Reports ——
  {
    key: "report-hub",
    label: "Report Hub",
    description: "Registers and exports",
    href: "/app/reports/hub",
    icon: FileText,
    section: "reports",
    featureCode: "advanced_reports",
    permission: "reports.view",
    accent: "navy",
  },
  {
    key: "mis",
    label: "EHS MIS",
    description: "Management information",
    href: "/app/mis",
    icon: FileSpreadsheet,
    section: "reports",
    permission: "mis.view",
    accent: "teal",
  },
  {
    key: "ehs-score",
    label: "EHS Scorecard",
    description: "Dimensional scoring",
    href: "/app/ehs-score",
    icon: Gauge,
    section: "reports",
    permission: "score.view",
    accent: "amber",
  },
  {
    key: "analytics",
    label: "Analytics",
    description: "Trends and drill-down",
    href: "/app/analytics",
    icon: BarChart3,
    section: "reports",
    featureCode: "advanced_analytics",
    permission: "analytics.view",
    accent: "slate",
  },
  {
    key: "reports",
    label: "Reports",
    description: "Report builder",
    href: "/app/reports",
    icon: FileText,
    section: "reports",
    featureCode: "advanced_reports",
    permission: "reports.view",
    accent: "navy",
  },

  // —— AI Copilot ——
  {
    key: "ai-copilot",
    label: "EHS Copilot",
    description: "Assistive intelligence",
    href: "/app/ai",
    icon: Sparkles,
    section: "ai",
    featureCode: "ai_copilot",
    permission: "ai.use",
    accent: "teal",
  },
  {
    key: "ai-agents",
    label: "AI Agents",
    description: "Triage, classification, anomaly flags",
    href: "/app/ai/agents",
    icon: Bot,
    section: "ai",
    featureCode: "ai_copilot",
    permission: "ai.use",
    accent: "slate",
  },
  {
    key: "search",
    label: "Search",
    description: "Cross-module evidence search",
    href: "/app/search",
    icon: Search,
    section: "ai",
    featureCode: "enterprise_search",
    permission: "search.use",
    accent: "slate",
  },
];

export const LAUNCHPAD_SECTION_LABELS: Record<LaunchpadSection, string> = {
  dashboard: "My Dashboard",
  operations: "EHS Operations",
  reports: "Reports",
  ai: "AI Copilot",
};

export const LAUNCHPAD_SECTION_ORDER: LaunchpadSection[] = [
  "dashboard",
  "operations",
  "reports",
  "ai",
];

function isTileVisible(
  tile: LaunchpadTile,
  enabledFeatures: string[],
  permissions: string[],
): boolean {
  if (tile.featureCode && !enabledFeatures.includes(tile.featureCode)) return false;
  if (tile.permission && !permissions.includes(tile.permission)) {
    if (tile.key === "dashboard") return true;
    return false;
  }
  return true;
}

export function filterLaunchpadTiles(
  tiles: LaunchpadTile[],
  enabledFeatures: string[],
  permissions: string[],
): LaunchpadTile[] {
  return tiles.filter((tile) => isTileVisible(tile, enabledFeatures, permissions));
}

export function resolvePersonaLabel(roleCodes: string[]): string {
  if (roleCodes.includes("auditor")) return "Auditor";
  if (
    roleCodes.some((c) =>
      ["ehs_admin", "ehs_manager", "tenant_admin", "super_admin"].includes(c),
    )
  ) {
    return "Corporate EHS";
  }
  if (roleCodes.some((c) => ["ehs_officer", "investigator"].includes(c))) {
    return "Safety Officer";
  }
  if (roleCodes.some((c) => ["site_manager", "department_head", "supervisor"].includes(c))) {
    return "Site / Project Manager";
  }
  if (roleCodes.includes("contractor")) return "Contractor";
  return "Worker";
}

/** Prioritize dashboard tiles for the user's persona */
export function selectDashboardTiles(
  visible: LaunchpadTile[],
  roleCodes: string[],
): LaunchpadTile[] {
  const personaShortcuts = visible.filter(
    (t) =>
      t.section !== "dashboard" &&
      t.dashboardRoles?.length &&
      t.dashboardRoles.some((r) => roleCodes.includes(r)),
  );
  const dashboardBase = visible.filter((t) => t.section === "dashboard");
  return [...personaShortcuts, ...dashboardBase].slice(0, 4);
}

export function groupLaunchpadBySection(
  visible: LaunchpadTile[],
): Record<LaunchpadSection, LaunchpadTile[]> {
  const grouped: Record<LaunchpadSection, LaunchpadTile[]> = {
    dashboard: [],
    operations: [],
    reports: [],
    ai: [],
  };
  for (const tile of visible) {
    grouped[tile.section].push(tile);
  }
  return grouped;
}
