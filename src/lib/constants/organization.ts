export const INDUSTRIES = [
  "Construction",
  "EPC",
  "Power & Energy",
  "Transmission & Distribution",
  "Renewable Energy",
  "Solar",
  "Wind",
  "Manufacturing",
  "Oil & Gas",
  "Chemicals",
  "Mining",
  "Infrastructure",
  "Logistics",
  "Warehousing",
  "Facilities",
  "Other",
] as const;

export const COMPANY_SIZES = [
  "1-50",
  "51-250",
  "251-1000",
  "1000+",
] as const;

export const DEFAULT_PROJECT_TYPES = [
  { code: "solar", name: "Solar" },
  { code: "transmission_line", name: "Transmission Line" },
  { code: "substation", name: "Substation" },
  { code: "construction", name: "Construction" },
  { code: "manufacturing", name: "Manufacturing" },
  { code: "infrastructure", name: "Infrastructure" },
] as const;

export const DEFAULT_DEPARTMENTS = [
  { code: "EHS", name: "EHS" },
  { code: "CIVIL", name: "Civil" },
  { code: "ELEC", name: "Electrical" },
  { code: "MECH", name: "Mechanical" },
  { code: "OPS", name: "Operations" },
  { code: "HR", name: "HR" },
  { code: "PROC", name: "Procurement" },
  { code: "ADMIN", name: "Administration" },
] as const;

export const LOCATION_TYPES = [
  "plant_area",
  "building",
  "tower_location",
  "warehouse",
  "workshop",
  "substation",
  "solar_block",
  "construction_zone",
  "office",
  "other",
] as const;

export const INVITE_ROLE_CODES = [
  "ehs_manager",
  "ehs_officer",
  "site_manager",
  "supervisor",
  "employee",
  "contractor",
  "auditor",
  "viewer",
] as const;

export const ONBOARDING_STEPS = [
  "welcome",
  "company",
  "industry",
  "structure",
  "business_unit",
  "site",
  "project",
  "invite",
  "ehs_config",
  "review",
  "finish",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const OPTIONAL_ONBOARDING_STEPS: OnboardingStep[] = [
  "business_unit",
  "project",
  "invite",
  "ehs_config",
];
