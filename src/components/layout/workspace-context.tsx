"use client";

import {
  setProjectContextAction,
  setSiteContextAction,
  switchOrganizationAction,
} from "@/app/actions/workspace";

type OrgOption = { id: string; name: string };
type Named = { id: string; name: string };

export function WorkspaceContextSwitchers({
  organizations,
  organizationId,
  sites,
  siteId,
  projects,
  projectId,
}: {
  organizations: OrgOption[];
  organizationId: string;
  sites: Named[];
  siteId: string | null;
  projects: Named[];
  projectId: string | null;
}) {
  return (
    <div className="hidden min-w-0 items-center gap-2 lg:flex">
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
            className="h-10 max-w-[11rem] rounded-lg border border-border bg-card px-2 text-xs font-medium"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
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
          className="h-10 max-w-[10rem] rounded-lg border border-border bg-card px-2 text-xs"
        >
          <option value="">All sites</option>
          {sites.map((site) => (
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
          className="h-10 max-w-[10rem] rounded-lg border border-border bg-card px-2 text-xs"
        >
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}
