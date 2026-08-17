import { describe, expect, it } from "vitest";
import {
  canManageBilling,
  canManageOrganization,
  canManageSubscription,
  hasPlatformPermission,
  isPlatformAdmin,
  resolvePlatformRole,
} from "@/lib/auth/platform";

describe("platform RBAC", () => {
  it("does not grant every admin full access", () => {
    const support = resolvePlatformRole({
      isPlatformAdmin: true,
      platformRole: "support_admin",
    });
    expect(canManageOrganization(support)).toBe(true);
    expect(canManageSubscription(support)).toBe(false);
    expect(canManageBilling(support)).toBe(false);
    expect(hasPlatformPermission(support, "saas.entitlements.override")).toBe(false);
    expect(hasPlatformPermission(support, "saas.audit.view")).toBe(true);
  });

  it("keeps billing_admin off organization create/suspend", () => {
    const billing = resolvePlatformRole({
      isPlatformAdmin: true,
      platformRole: "billing_admin",
    });
    expect(hasPlatformPermission(billing, "saas.organizations.create")).toBe(false);
    expect(hasPlatformPermission(billing, "saas.billing.manage")).toBe(true);
  });

  it("treats read_only as view-only", () => {
    const reader = resolvePlatformRole({
      isPlatformAdmin: true,
      platformRole: "read_only",
    });
    expect(canManageOrganization(reader)).toBe(false);
    expect(canManageSubscription(reader)).toBe(false);
    expect(hasPlatformPermission(reader, "saas.organizations.view")).toBe(true);
  });

  it("rejects non-platform users", () => {
    expect(isPlatformAdmin(resolvePlatformRole({ isPlatformAdmin: false }))).toBe(false);
  });
});
