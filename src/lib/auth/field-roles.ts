export type FieldRole =
  | "contractor"
  | "employee"
  | "supervisor"
  | "ehs_officer"
  | "ehs_manager"
  | "tenant_admin";

export type FieldAction =
  | "report_incident"
  | "report_near_miss"
  | "report_hazard"
  | "inspection"
  | "my_actions"
  | "my_permits"
  | "training"
  | "toolbox"
  | "approve_permit"
  | "team_view"
  | "site_view"
  | "site_visit";

const ROLE_ACTIONS: Record<FieldRole, FieldAction[]> = {
  contractor: [
    "report_hazard",
    "report_near_miss",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
  ],
  employee: [
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
  ],
  supervisor: [
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "inspection",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
    "approve_permit",
    "team_view",
  ],
  ehs_officer: [
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "inspection",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
    "approve_permit",
    "team_view",
    "site_view",
  ],
  ehs_manager: [
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "inspection",
    "my_actions",
    "my_permits",
    "training",
    "toolbox",
    "approve_permit",
    "team_view",
    "site_view",
  ],
  tenant_admin: [
    "report_incident",
    "report_near_miss",
    "report_hazard",
    "site_visit",
    "inspection",
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
