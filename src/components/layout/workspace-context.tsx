"use client";

import {
  setBusinessUnitContextAction,
  setProjectContextAction,
  setRegionContextAction,
  setSiteContextAction,
  switchOrganizationAction,
} from "@/app/actions/workspace";

type OrgOption = { id: string; name: string };
type Named = { id: string; name: string };
type Region = Named & { business_unit_id: string | null };
type Site = Named & { region_id?: string | null; business_unit_id?: string | null };
type Project = Named & { site_id?: string | null; business_unit_id?: string | null };

export function WorkspaceContextSwitchers({
  organizations,
  organizationId,
  businessUnits,
  businessUnitId,
  regions,
  regionId,
  sites,
  siteId,
  projects,
  projectId,
}: {
  organizations: OrgOption[];
  organizationId: string;
  businessUnits: Named[];
  businessUnitId: string | null;
  regions: Region[];
  regionId: string | null;
  sites: Site[];
  siteId: string | null;
  projects: Project[];
  projectId: string | null;
}) {
  const filteredRegions = businessUnitId
    ? regions.filter((r) => r.business_unit_id === businessUnitId || !r.business_unit_id)
    : regions;

  const filteredSites = sites.filter((site) => {
    if (businessUnitId && site.business_unit_id && site.business_unit_id !== businessUnitId) {
      return false;
    }
    if (regionId && site.region_id && site.region_id !== regionId) {
      return false;
    }
    return true;
  });

  const filteredProjects = projects.filter((project) => {
    if (businessUnitId && project.business_unit_id && project.business_unit_id !== businessUnitId) {
      return false;
    }
    if (siteId && project.site_id && project.site_id !== siteId) {
      return false;
    }
    return true;
  });

  const selectClass =
    "h-10 max-w-[9rem] rounded-lg border border-border bg-card px-2 text-xs truncate";

  return (
    <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
      {organizations.length > 1 ? (
        <form action={switchOrganizationAction}>
          <label className="sr-only" htmlFor="org-switcher">
            Organization
          </label>
          <select
            id="org-switcher"
            name="organizationId"
            defaultValue={organizationId}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={selectClass}
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </form>
      ) : null}
      {businessUnits.length ? (
        <form action={setBusinessUnitContextAction}>
          <input type="hidden" name="organizationId" value={organizationId} />
          <label className="sr-only" htmlFor="bu-switcher">
            Business unit
          </label>
          <select
            id="bu-switcher"
            name="businessUnitId"
            defaultValue={businessUnitId ?? ""}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={selectClass}
          >
            <option value="">All BUs</option>
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </select>
        </form>
      ) : null}
      {regions.length ? (
        <form action={setRegionContextAction}>
          <input type="hidden" name="organizationId" value={organizationId} />
          <label className="sr-only" htmlFor="region-switcher">
            Region
          </label>
          <select
            id="region-switcher"
            name="regionId"
            defaultValue={regionId ?? ""}
            onChange={(event) => event.currentTarget.form?.requestSubmit()}
            className={selectClass}
          >
            <option value="">All regions</option>
            {filteredRegions.map((region) => (
              <option key={region.id} value={region.id}>
                {region.name}
              </option>
            ))}
          </select>
        </form>
      ) : null}
      <form action={setSiteContextAction}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <label className="sr-only" htmlFor="site-switcher">
          Site
        </label>
        <select
          id="site-switcher"
          name="siteId"
          defaultValue={siteId ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={selectClass}
        >
          <option value="">All sites</option>
          {filteredSites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </form>
      <form action={setProjectContextAction}>
        <input type="hidden" name="organizationId" value={organizationId} />
        <label className="sr-only" htmlFor="project-switcher">
          Project
        </label>
        <select
          id="project-switcher"
          name="projectId"
          defaultValue={projectId ?? ""}
          onChange={(event) => event.currentTarget.form?.requestSubmit()}
          className={selectClass}
        >
          <option value="">All projects</option>
          {filteredProjects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}
