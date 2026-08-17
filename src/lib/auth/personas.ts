export const FIELD_ONLY_ROLES = ["employee", "contractor"] as const;
export const CONTRACTOR_PORTAL_ROLES = ["contractor_contact"] as const;
export const REPORTING_ROLES = ["ehs_officer", "auditor", "investigator"] as const;
export const COMPANY_ADMIN_ROLES = ["ehs_admin", "super_admin", "tenant_admin"] as const;

export type LoginPortal = "admin" | "company" | "field" | "contractor";

export function isContractorPortalOnly(roleCodes: string[]) {
  if (!roleCodes.length) return false;
  return roleCodes.every((code) =>
    (CONTRACTOR_PORTAL_ROLES as readonly string[]).includes(code),
  );
}

export function isFieldOnlyRoles(roleCodes: string[]) {
  if (!roleCodes.length) return false;
  return roleCodes.every((code) => (FIELD_ONLY_ROLES as readonly string[]).includes(code));
}

export function isReportingRole(roleCodes: string[]) {
  return roleCodes.some((code) => (REPORTING_ROLES as readonly string[]).includes(code));
}

export function isCompanyAdminRole(roleCodes: string[]) {
  return roleCodes.some((code) => (COMPANY_ADMIN_ROLES as readonly string[]).includes(code));
}

export function landingPathForSession(input: {
  portal: LoginPortal;
  isPlatformAdmin: boolean;
  roleCodes: string[];
}) {
  if (input.portal === "admin") {
    return input.isPlatformAdmin ? "/admin/tenants" : null;
  }

  if (input.portal === "field") {
    if (input.isPlatformAdmin && !input.roleCodes.length) return null;
    return "/field/home";
  }

  if (input.portal === "contractor") {
    if (input.isPlatformAdmin && !input.roleCodes.length) return null;
    return "/contractor";
  }

  if (isContractorPortalOnly(input.roleCodes)) return "/contractor";
  if (isFieldOnlyRoles(input.roleCodes)) return "/field/home";
  if (input.roleCodes.includes("company_secretary") || input.roleCodes.includes("compliance_officer")) {
    return "/app/compliance/dashboard";
  }
  if (input.roleCodes.includes("esg_officer") || input.roleCodes.includes("esg_committee_member")) {
    return "/app/esg/metrics";
  }
  if (isReportingRole(input.roleCodes) && !isCompanyAdminRole(input.roleCodes)) {
    return "/app/reporting/queue";
  }
  return "/app/dashboard";
}

export const GENERIC_INVALID_CREDENTIALS = "Invalid credentials";
