export type FieldRole =
  | "contractor"
  | "employee"
  | "supervisor"
  | "ehs_officer"
  | "ehs_manager"
  | "tenant_admin";

export type FieldAction =
  | "my_zone"
  | "raksha_reports"
  | "report_incident"
  | "report_near_miss"
  | "report_hazard"
  | "site_visit"
  | "utilities"
  | "training"
  | "ehs_mis"
  | "ehs_score"
  | "nc"
  | "inspection"
  | "new_checklist"
  | "checklist_template"
  | "lmra"
  | "my_permits"
  | "bbs"
  | "my_actions"
  | "toolbox"
  | "approve_permit"
  | "team_view"
  | "site_view";

const ROLE_ACTIONS: Record<FieldRole, FieldAction[]> = {
  contractor: [
    "my_zone",
    "report_hazard",
    "report_near_miss",
    "bbs",
    "lmra",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
  ],
  employee: [
    "my_zone",
    "raksha_reports",
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "lmra",
    "bbs",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
  ],
  supervisor: [
    "my_zone",
    "raksha_reports",
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "lmra",
    "bbs",
    "inspection",
    "new_checklist",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
    "approve_permit",
    "team_view",
  ],
  ehs_officer: [
    "my_zone",
    "raksha_reports",
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "lmra",
    "bbs",
    "inspection",
    "new_checklist",
    "checklist_template",
    "nc",
    "ehs_mis",
    "ehs_score",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
    "approve_permit",
    "team_view",
    "site_view",
  ],
  ehs_manager: [
    "my_zone",
    "raksha_reports",
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "utilities",
    "lmra",
    "bbs",
    "inspection",
    "new_checklist",
    "checklist_template",
    "nc",
    "ehs_mis",
    "ehs_score",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
    "approve_permit",
    "team_view",
    "site_view",
  ],
  tenant_admin: [
    "my_zone",
    "raksha_reports",
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "utilities",
    "lmra",
    "bbs",
    "inspection",
    "new_checklist",
    "checklist_template",
    "nc",
    "ehs_mis",
    "ehs_score",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
    "approve_permit",
    "team_view",
    "site_view",
  ],
};

export function fieldRoleFromCodes(roleCodes: string[]): FieldRole {
  const set = new Set(roleCodes);
  if (set.has("tenant_admin")) return "tenant_admin";
  if (set.has("ehs_manager")) return "ehs_manager";
  if (set.has("ehs_officer")) return "ehs_officer";
  if (set.has("supervisor")) return "supervisor";
  if (set.has("contractor")) return "contractor";
  return "employee";
}

export function canFieldAction(role: FieldRole, action: FieldAction) {
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}

export function greetingForNow(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "GOOD MORNING";
  if (h < 17) return "GOOD AFTERNOON";
  return "GOOD EVENING";
}
