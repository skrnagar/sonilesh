import type { FieldAction, FieldRole } from "@/lib/auth/field-roles";
import { canFieldAction } from "@/lib/auth/field-roles";

/** Stable keys for Raksha / KEC BI report hub entries. */
export type FieldReportKey =
  // Raksha Reports
  | "ua-ucs"
  | "incidents"
  | "hsv-rsv"
  | "tsv"
  | "action-items"
  | "covid-startup-checklist"
  | "ehs-mis-status"
  | "bu-region-ehs-score"
  // iQuality Reports
  | "quality-observations"
  | "checklists"
  | "checklist-templates"
  | "observation-ageing"
  | "quality-score"
  | "quality-mis"
  | "crs-checklist-tracking"
  | "project-locations"
  | "ims-audit-report"
  // Other Reports + BRSR
  | "project-role-matrix"
  | "workforce-tracking"
  | "user-profile-data"
  | "projects"
  | "myzone-installation-status"
  | "communication-matrix"
  | "brsr"
  | "status-tracking-details";

export type FieldReportCategory = "raksha" | "iquality" | "other";

export type FieldReportLink = {
  key: FieldReportKey;
  label: string;
  category: FieldReportCategory;
  /** Field route — live modules go direct; scaffold modules use /field/reports/[key]. */
  href: string;
  fieldAction: FieldAction;
  status: "live" | "scaffold";
  /** Best desktop redirect when field UI is not built yet. */
  webHref?: string;
  /** Implementation notes for engineers. */
  nextSteps?: string;
};

export const FIELD_REPORT_CATEGORIES: {
  key: FieldReportCategory;
  label: string;
  subtitle?: string;
}[] = [
  { key: "raksha", label: "Raksha Reports" },
  { key: "iquality", label: "iQuality Reports" },
  {
    key: "other",
    label: "Other Reports",
    subtitle: "BRSR",
  },
];

/**
 * Full Raksha Reports hub link map — mirrors digital.kecrpg.com RakShaDashboard.
 * Live links route to field modules; scaffold links open a coming-soon page with web redirect.
 */
export const FIELD_REPORT_LINKS: FieldReportLink[] = [
  // — Raksha Reports —
  {
    key: "ua-ucs",
    label: "UA UCs",
    category: "raksha",
    href: "/field/ualist",
    fieldAction: "report_hazard",
    status: "live",
  },
  {
    key: "incidents",
    label: "Incidents",
    category: "raksha",
    href: "/field/incident",
    fieldAction: "report_incident",
    status: "live",
    nextSteps: "Add incidents register list view; form capture is live at /field/incident.",
  },
  {
    key: "hsv-rsv",
    label: "HSVRSV",
    category: "raksha",
    href: "/field/site-visits?type=hsv",
    fieldAction: "site_visit",
    status: "live",
  },
  {
    key: "tsv",
    label: "TSV",
    category: "raksha",
    href: "/field/site-visits?type=tsv",
    fieldAction: "site_visit",
    status: "live",
  },
  {
    key: "action-items",
    label: "Action Items",
    category: "raksha",
    href: "/field/actions",
    fieldAction: "my_actions",
    status: "live",
  },
  {
    key: "covid-startup-checklist",
    label: "Covid Startup Checklist",
    category: "raksha",
    href: "/field/reports/covid-startup-checklist",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/reports/hub",
    nextSteps: "Port Covid startup checklist template runner to field.",
  },
  {
    key: "ehs-mis-status",
    label: "EHS MIS Status",
    category: "raksha",
    href: "/field/mis",
    fieldAction: "ehs_mis",
    status: "live",
    nextSteps: "MIS submission scaffold — wire to MIS service when API is ready.",
  },
  {
    key: "bu-region-ehs-score",
    label: "BU/Region wise EHS Score",
    category: "raksha",
    href: "/field/ehs-score",
    fieldAction: "ehs_score",
    status: "live",
    nextSteps: "BI dashboard with MIS pending counts, yearly chart, and score status table.",
  },
  // — iQuality Reports —
  {
    key: "quality-observations",
    label: "Quality Observations",
    category: "iquality",
    href: "/field/reports/quality-observations",
    fieldAction: "raksha_reports",
    status: "live",
    nextSteps: "Hierarchical report with SBU/region/project filters, export, and mobile cards.",
  },
  {
    key: "checklists",
    label: "Checklists",
    category: "iquality",
    href: "/field/inspection",
    fieldAction: "inspection",
    status: "live",
  },
  {
    key: "checklist-templates",
    label: "Checklist Templates",
    category: "iquality",
    href: "/field/checklist/templates",
    fieldAction: "checklist_template",
    status: "live",
    nextSteps: "Template browser scaffold — full template management on desktop.",
  },
  {
    key: "observation-ageing",
    label: "Observation Ageing",
    category: "iquality",
    href: "/field/reports/observation-ageing",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/analytics",
    nextSteps: "Ageing analytics widget — desktop BI only for now.",
  },
  {
    key: "quality-score",
    label: "Quality Score",
    category: "iquality",
    href: "/field/reports/quality-score",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/analytics",
    nextSteps: "Quality score dashboard pending iQuality module.",
  },
  {
    key: "quality-mis",
    label: "Quality MIS",
    category: "iquality",
    href: "/field/reports/quality-mis",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/reports/hub",
    nextSteps: "Quality MIS export — desktop only.",
  },
  {
    key: "crs-checklist-tracking",
    label: "CRS Checklist Tracking",
    category: "iquality",
    href: "/field/reports/crs-checklist-tracking",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/inspections",
    nextSteps: "CRS tracking register — link to inspections module.",
  },
  {
    key: "project-locations",
    label: "Project Locations",
    category: "iquality",
    href: "/field/reports/project-locations",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/settings",
    nextSteps: "Project location map — settings/sites on desktop.",
  },
  {
    key: "ims-audit-report",
    label: "IMS Audit Report",
    category: "iquality",
    href: "/field/reports/ims-audit-report",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/audits",
    nextSteps: "IMS audit export — desktop audits module.",
  },
  // — Other Reports + BRSR —
  {
    key: "project-role-matrix",
    label: "Project wise Role matrix",
    category: "other",
    href: "/field/reports/project-role-matrix",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/settings",
    nextSteps: "WFM role matrix — desktop settings.",
  },
  {
    key: "workforce-tracking",
    label: "Workforce Tracking",
    category: "other",
    href: "/field/reports/workforce-tracking",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/contractors",
    nextSteps: "Workforce geo-tracking — contractor module.",
  },
  {
    key: "user-profile-data",
    label: "User Profile Data",
    category: "other",
    href: "/field/profile",
    fieldAction: "my_zone",
    status: "live",
  },
  {
    key: "projects",
    label: "Projects",
    category: "other",
    href: "/field/reports/projects",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/settings",
    nextSteps: "Project directory — org hierarchy on desktop.",
  },
  {
    key: "myzone-installation-status",
    label: "MyZone Installation Status",
    category: "other",
    href: "/field/reports/myzone-installation-status",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/reports/hub",
    nextSteps: "MyZone install telemetry — ops dashboard.",
  },
  {
    key: "communication-matrix",
    label: "Communication Matrix",
    category: "other",
    href: "/field/reports/communication-matrix",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/settings",
    nextSteps: "Escalation matrix — desktop settings.",
  },
  {
    key: "brsr",
    label: "BRSR",
    category: "other",
    href: "/field/reports/brsr",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/esg/brsr-report",
    nextSteps: "BRSR status tracking — ESG module on desktop.",
  },
  {
    key: "status-tracking-details",
    label: "Status Tracking & Details",
    category: "other",
    href: "/field/reports/status-tracking-details",
    fieldAction: "raksha_reports",
    status: "scaffold",
    webHref: "/app/esg/brsr-report",
    nextSteps: "BRSR status detail drill-down.",
  },
];

const linkByKey = new Map(FIELD_REPORT_LINKS.map((link) => [link.key, link]));

export function getFieldReportLink(key: FieldReportKey): FieldReportLink | undefined {
  return linkByKey.get(key);
}

export function getFieldReportLinksForCategory(
  category: FieldReportCategory,
  role: FieldRole,
): FieldReportLink[] {
  return FIELD_REPORT_LINKS.filter(
    (link) => link.category === category && canFieldAction(role, link.fieldAction),
  );
}

export function filterFieldReportLinks(role: FieldRole): FieldReportLink[] {
  return FIELD_REPORT_LINKS.filter((link) => canFieldAction(role, link.fieldAction));
}

export const FIELD_ROLE_LABELS: Record<FieldRole, string> = {
  contractor: "Contractor",
  employee: "Employee",
  supervisor: "Supervisor",
  ehs_officer: "EHS Officer",
  ehs_manager: "EHS Manager",
  tenant_admin: "Administrator",
};

/** Mirrors Raksha "Access At" column from session workspace cookies. */
export function resolveAccessAtLevel(scope: {
  projectId: string | null;
  siteId: string | null;
  regionId: string | null;
  businessUnitId: string | null;
}): string {
  if (scope.projectId) return "Project";
  if (scope.siteId) return "Site";
  if (scope.regionId) return "Region";
  if (scope.businessUnitId) return "Business Unit";
  return "Organization";
}
