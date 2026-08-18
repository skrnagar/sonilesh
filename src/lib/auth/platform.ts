export type PlatformRole =
  | "super_admin"
  | "platform_admin"
  | "billing_admin"
  | "support_admin"
  | "read_only";

export type PlatformPermission =
  | "saas.organizations.view"
  | "saas.organizations.create"
  | "saas.organizations.update"
  | "saas.organizations.suspend"
  | "saas.subscriptions.view"
  | "saas.subscriptions.manage"
  | "saas.plans.view"
  | "saas.plans.manage"
  | "saas.features.view"
  | "saas.features.manage"
  | "saas.entitlements.view"
  | "saas.entitlements.override"
  | "saas.usage.view"
  | "saas.billing.view"
  | "saas.billing.manage"
  | "saas.audit.view"
  | "saas.ai.observability";

const ALL: PlatformPermission[] = [
  "saas.organizations.view",
  "saas.organizations.create",
  "saas.organizations.update",
  "saas.organizations.suspend",
  "saas.subscriptions.view",
  "saas.subscriptions.manage",
  "saas.plans.view",
  "saas.plans.manage",
  "saas.features.view",
  "saas.features.manage",
  "saas.entitlements.view",
  "saas.entitlements.override",
  "saas.usage.view",
  "saas.billing.view",
  "saas.billing.manage",
  "saas.audit.view",
  "saas.ai.observability",
];

const ROLE_PERMISSIONS: Record<PlatformRole, PlatformPermission[]> = {
  super_admin: ALL,
  platform_admin: ALL.filter((code) => code !== "saas.billing.manage"),
  billing_admin: [
    "saas.organizations.view",
    "saas.subscriptions.view",
    "saas.subscriptions.manage",
    "saas.plans.view",
    "saas.entitlements.view",
    "saas.usage.view",
    "saas.billing.view",
    "saas.billing.manage",
    "saas.audit.view",
  ],
  support_admin: [
    "saas.organizations.view",
    "saas.organizations.update",
    "saas.subscriptions.view",
    "saas.plans.view",
    "saas.features.view",
    "saas.entitlements.view",
    "saas.usage.view",
    "saas.billing.view",
    "saas.audit.view",
  ],
  read_only: [
    "saas.organizations.view",
    "saas.subscriptions.view",
    "saas.plans.view",
    "saas.features.view",
    "saas.entitlements.view",
    "saas.usage.view",
    "saas.billing.view",
    "saas.audit.view",
  ],
};

export function resolvePlatformRole(input: {
  isPlatformAdmin?: boolean | null;
  platformRole?: string | null;
}): PlatformRole | null {
  if (!input.isPlatformAdmin) return null;
  if (
    input.platformRole === "super_admin" ||
    input.platformRole === "platform_admin" ||
    input.platformRole === "billing_admin" ||
    input.platformRole === "support_admin" ||
    input.platformRole === "read_only"
  ) {
    return input.platformRole;
  }
  return "super_admin";
}

export function platformPermissionsFor(role: PlatformRole | null): PlatformPermission[] {
  if (!role) return [];
  return ROLE_PERMISSIONS[role];
}

export function hasPlatformPermission(
  role: PlatformRole | null,
  permission: PlatformPermission,
) {
  return platformPermissionsFor(role).includes(permission);
}

export function isPlatformAdmin(role: PlatformRole | null) {
  return role !== null;
}

export function canManageOrganization(role: PlatformRole | null) {
  return hasPlatformPermission(role, "saas.organizations.update");
}

export function canManageSubscription(role: PlatformRole | null) {
  return hasPlatformPermission(role, "saas.subscriptions.manage");
}

export function canManageFeatures(role: PlatformRole | null) {
  return hasPlatformPermission(role, "saas.features.manage");
}

export function canManagePlans(role: PlatformRole | null) {
  return hasPlatformPermission(role, "saas.plans.manage");
}

export function canManageBilling(role: PlatformRole | null) {
  return hasPlatformPermission(role, "saas.billing.manage");
}

export function canOverrideEntitlements(role: PlatformRole | null) {
  return hasPlatformPermission(role, "saas.entitlements.override");
}

export function canCreateOrganization(role: PlatformRole | null) {
  return hasPlatformPermission(role, "saas.organizations.create");
}

export function canSuspendOrganization(role: PlatformRole | null) {
  return hasPlatformPermission(role, "saas.organizations.suspend");
}

export const ADMIN_HREF_PERMISSION: Record<string, PlatformPermission | null> = {
  "/admin": null,
  "/admin/dashboard": null,
  "/admin/organizations": "saas.organizations.view",
  "/admin/users": "saas.organizations.view",
  "/admin/plans": "saas.plans.view",
  "/admin/features": "saas.features.view",
  "/admin/subscriptions": "saas.subscriptions.view",
  "/admin/entitlements": "saas.entitlements.view",
  "/admin/usage": "saas.usage.view",
  "/admin/billing": "saas.billing.view",
  "/admin/support": "saas.organizations.view",
  "/admin/audit": "saas.audit.view",
  "/admin/ai/observability": "saas.ai.observability",
  "/admin/obligations": "saas.features.view",
  "/admin/settings": "saas.organizations.update",
};
