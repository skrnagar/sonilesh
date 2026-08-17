export const REPORT_TYPE_CODES = [
  "incident",
  "near_miss",
  "hazard",
  "unsafe_act",
  "unsafe_condition",
  "safety_observation",
] as const;

export type ReportTypeCode = (typeof REPORT_TYPE_CODES)[number];

export const REPORT_TYPE_META: Record<
  ReportTypeCode,
  {
    label: string;
    featureCode: string;
    permissionCreate: string;
    permissionView: string;
    listPath: string;
    prefix: string;
  }
> = {
  incident: {
    label: "Incident",
    featureCode: "incident_management",
    permissionCreate: "incidents.create",
    permissionView: "incidents.view",
    listPath: "/app/incidents",
    prefix: "INC-",
  },
  near_miss: {
    label: "Near Miss",
    featureCode: "near_miss",
    permissionCreate: "near_miss.create",
    permissionView: "near_miss.view",
    listPath: "/app/near-misses",
    prefix: "NM-",
  },
  hazard: {
    label: "Hazard",
    featureCode: "hazard_reporting",
    permissionCreate: "hazards.create",
    permissionView: "hazards.view",
    listPath: "/app/hazards",
    prefix: "HZ-",
  },
  unsafe_act: {
    label: "Unsafe Act",
    featureCode: "hazard_reporting",
    permissionCreate: "hazards.create",
    permissionView: "hazards.view",
    listPath: "/app/observations",
    prefix: "UA-",
  },
  unsafe_condition: {
    label: "Unsafe Condition",
    featureCode: "hazard_reporting",
    permissionCreate: "hazards.create",
    permissionView: "hazards.view",
    listPath: "/app/observations",
    prefix: "UC-",
  },
  safety_observation: {
    label: "Safety Observation",
    featureCode: "hazard_reporting",
    permissionCreate: "hazards.create",
    permissionView: "hazards.view",
    listPath: "/app/observations",
    prefix: "SO-",
  },
};

export const CUSTOM_FIELD_TYPES = [
  "text",
  "long_text",
  "number",
  "date",
  "datetime",
  "boolean",
  "single_select",
  "multi_select",
  "user",
  "site",
  "project",
  "department",
  "location",
  "attachment",
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number];

/** Required base fields by report type (validation contract). */
export function requiredFieldsForType(type: ReportTypeCode): string[] {
  switch (type) {
    case "incident":
      return ["occurredAt", "siteId", "description", "severityId"];
    case "near_miss":
      return ["occurredAt", "siteId", "description", "potentialSeverityId"];
    case "hazard":
      return ["siteId", "description", "categoryId"];
    case "unsafe_act":
    case "unsafe_condition":
      return ["siteId", "description"];
    case "safety_observation":
      return ["siteId", "description", "observationPolarity"];
    default:
      return ["description"];
  }
}

export function capaSourceModuleForType(type: string):
  | "incident"
  | "near_miss"
  | "hazard"
  | "unsafe_act"
  | "unsafe_condition"
  | "safety_observation"
  | "ehs_report" {
  if (type === "incident") return "incident";
  if (type === "near_miss") return "near_miss";
  if (type === "hazard") return "hazard";
  if (type === "unsafe_act") return "unsafe_act";
  if (type === "unsafe_condition") return "unsafe_condition";
  if (type === "safety_observation") return "safety_observation";
  return "ehs_report";
}
