import { describe, expect, it } from "vitest";
import {
  getCurrentOrganizationId,
  resolveProjectContext,
  resolveSiteContext,
  scopesAllowSite,
  type TenantScope,
} from "@/lib/tenancy/context";

describe("getCurrentOrganizationId", () => {
  it("returns the cookie org when it is in the user's memberships", () => {
    expect(
      getCurrentOrganizationId({
        cookieOrgId: "org-b",
        membershipOrganizationIds: ["org-a", "org-b", "org-c"],
      }),
    ).toBe("org-b");
  });

  it("ignores a cookie org that is not in memberships", () => {
    expect(
      getCurrentOrganizationId({
        cookieOrgId: "org-forged",
        membershipOrganizationIds: ["org-a", "org-b"],
      }),
    ).toBe("org-a");
  });

  it("falls back to the first membership when no cookie is set", () => {
    expect(
      getCurrentOrganizationId({
        cookieOrgId: null,
        membershipOrganizationIds: ["org-a", "org-b"],
      }),
    ).toBe("org-a");
  });

  it("returns null when there are no memberships", () => {
    expect(
      getCurrentOrganizationId({
        cookieOrgId: null,
        membershipOrganizationIds: [],
      }),
    ).toBeNull();
  });
});

describe("resolveSiteContext", () => {
  const siteIdsInOrg = ["site-1", "site-2"];

  it("returns null when no site is requested", () => {
    expect(
      resolveSiteContext({ requestedSiteId: null, siteIdsInOrg }),
    ).toBeNull();
  });

  it("returns the site id when it belongs to the organization", () => {
    expect(
      resolveSiteContext({ requestedSiteId: "site-2", siteIdsInOrg }),
    ).toBe("site-2");
  });

  it("returns null when the requested site is not in the organization", () => {
    expect(
      resolveSiteContext({ requestedSiteId: "site-other-org", siteIdsInOrg }),
    ).toBeNull();
  });
});

describe("resolveProjectContext", () => {
  const projects = [
    { id: "proj-1", site_id: "site-1" },
    { id: "proj-2", site_id: "site-2" },
    { id: "proj-org", site_id: null },
  ];

  it("returns null when no project is requested", () => {
    expect(
      resolveProjectContext({
        requestedProjectId: null,
        projects,
        currentSiteId: "site-1",
      }),
    ).toBeNull();
  });

  it("returns the project when it exists and site context matches", () => {
    expect(
      resolveProjectContext({
        requestedProjectId: "proj-1",
        projects,
        currentSiteId: "site-1",
      }),
    ).toBe("proj-1");
  });

  it("rejects a project when its site does not match the current site", () => {
    expect(
      resolveProjectContext({
        requestedProjectId: "proj-2",
        projects,
        currentSiteId: "site-1",
      }),
    ).toBeNull();
  });

  it("returns null when the project id is unknown", () => {
    expect(
      resolveProjectContext({
        requestedProjectId: "proj-missing",
        projects,
        currentSiteId: "site-1",
      }),
    ).toBeNull();
  });

  it("allows org-wide projects without a site when a site is selected", () => {
    expect(
      resolveProjectContext({
        requestedProjectId: "proj-org",
        projects,
        currentSiteId: "site-1",
      }),
    ).toBe("proj-org");
  });
});

describe("scopesAllowSite", () => {
  it("returns false when there are no scopes", () => {
    expect(scopesAllowSite([], "site-1")).toBe(false);
  });

  it("allows any site for organization-wide scope", () => {
    const scopes: TenantScope[] = [
      {
        scope: "organization",
        siteId: null,
        departmentId: null,
        businessUnitId: null,
        projectId: null,
      },
    ];
    expect(scopesAllowSite(scopes, "site-1")).toBe(true);
    expect(scopesAllowSite(scopes, "site-2")).toBe(true);
  });

  it("allows any site for platform and business_unit scopes", () => {
    expect(
      scopesAllowSite(
        [
          {
            scope: "platform",
            siteId: null,
            departmentId: null,
            businessUnitId: null,
            projectId: null,
          },
        ],
        "site-1",
      ),
    ).toBe(true);
    expect(
      scopesAllowSite(
        [
          {
            scope: "business_unit",
            siteId: null,
            departmentId: null,
            businessUnitId: "bu-1",
            projectId: null,
          },
        ],
        "site-9",
      ),
    ).toBe(true);
  });

  it("restricts site scope to the assigned site id", () => {
    const scopes: TenantScope[] = [
      {
        scope: "site",
        siteId: "site-1",
        departmentId: null,
        businessUnitId: null,
        projectId: null,
      },
    ];
    expect(scopesAllowSite(scopes, "site-1")).toBe(true);
    expect(scopesAllowSite(scopes, "site-2")).toBe(false);
  });
});
