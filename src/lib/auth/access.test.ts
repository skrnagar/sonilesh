import { describe, expect, it } from "vitest";
import { authorizeOrganizationAccess, siteInMemberScope } from "@/lib/auth/access";

describe("site access scope", () => {
  it("allows organization-scoped roles on any site in that tenant", () => {
    expect(
      siteInMemberScope([{ scope: "organization", siteId: null }], "site-1"),
    ).toBe(true);
  });

  it("restricts site-scoped roles to the assigned site", () => {
    expect(
      siteInMemberScope([{ scope: "site", siteId: "site-1" }], "site-2"),
    ).toBe(false);
    expect(
      siteInMemberScope([{ scope: "site", siteId: "site-1" }], "site-1"),
    ).toBe(true);
  });
});

describe("organization isolation", () => {
  it("never grants access from a URL organization id alone", () => {
    expect(
      authorizeOrganizationAccess({
        requestedOrganizationId: "org-b",
        membershipOrganizationIds: ["org-a"],
        isPlatformAdmin: false,
      }),
    ).toBe(false);
  });

  it("allows a member only for their own organization", () => {
    expect(
      authorizeOrganizationAccess({
        requestedOrganizationId: "org-a",
        membershipOrganizationIds: ["org-a"],
        isPlatformAdmin: false,
      }),
    ).toBe(true);
  });

  it("allows platform admins across organizations without implying tenant writes via RLS", () => {
    expect(
      authorizeOrganizationAccess({
        requestedOrganizationId: "org-b",
        membershipOrganizationIds: [],
        isPlatformAdmin: true,
      }),
    ).toBe(true);
  });
});

describe("site access scope", () => {
  it("allows organization-scoped roles on any site in that tenant", () => {
    expect(
      siteInMemberScope([{ scope: "organization", siteId: null }], "site-1"),
    ).toBe(true);
  });

  it("restricts site-scoped roles to the assigned site", () => {
    expect(
      siteInMemberScope([{ scope: "site", siteId: "site-1" }], "site-2"),
    ).toBe(false);
    expect(
      siteInMemberScope([{ scope: "site", siteId: "site-1" }], "site-1"),
    ).toBe(true);
  });
});
