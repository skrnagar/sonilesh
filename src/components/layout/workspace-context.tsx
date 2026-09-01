"use client";

import { useEffect, useState, useTransition } from "react";
import {
  setBusinessUnitContextAction,
  setProjectContextAction,
  setRegionContextAction,
  setSiteContextAction,
  switchOrganizationAction,
} from "@/app/actions/workspace";
import { cn } from "@/lib/utils";

type OrgOption = { id: string; name: string };
type Named = { id: string; name: string };
type Region = Named & { business_unit_id: string | null };
type Site = Named & { region_id?: string | null; business_unit_id?: string | null };
type Project = Named & { site_id?: string | null; business_unit_id?: string | null };

function ContextSelect({
  id,
  label,
  value,
  disabled,
  onChange,
  children,
}: {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <>
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        name={id}
        value={value}
        disabled={disabled}
        aria-busy={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "h-10 max-w-[9rem] truncate rounded-lg border border-border bg-card px-2 text-xs transition-opacity duration-150",
          disabled && "cursor-wait opacity-70",
        )}
      >
        {children}
      </select>
    </>
  );
}

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
  const [pending, startTransition] = useTransition();

  const [org, setOrg] = useState(organizationId);
  const [bu, setBu] = useState(businessUnitId ?? "");
  const [region, setRegion] = useState(regionId ?? "");
  const [site, setSite] = useState(siteId ?? "");
  const [project, setProject] = useState(projectId ?? "");

  useEffect(() => setOrg(organizationId), [organizationId]);
  useEffect(() => setBu(businessUnitId ?? ""), [businessUnitId]);
  useEffect(() => setRegion(regionId ?? ""), [regionId]);
  useEffect(() => setSite(siteId ?? ""), [siteId]);
  useEffect(() => setProject(projectId ?? ""), [projectId]);

  const filteredRegions = bu
    ? regions.filter((r) => r.business_unit_id === bu || !r.business_unit_id)
    : regions;

  const filteredSites = sites.filter((s) => {
    if (bu && s.business_unit_id && s.business_unit_id !== bu) return false;
    if (region && s.region_id && s.region_id !== region) return false;
    return true;
  });

  const filteredProjects = projects.filter((p) => {
    if (bu && p.business_unit_id && p.business_unit_id !== bu) return false;
    if (site && p.site_id && p.site_id !== site) return false;
    return true;
  });

  return (
    <div className="hidden min-w-0 items-center gap-1.5 sm:flex">
      {organizations.length > 1 ? (
        <ContextSelect
          id="org-switcher"
          label="Organization"
          value={org}
          disabled={pending}
          onChange={(next) => {
            setOrg(next);
            startTransition(async () => {
              const fd = new FormData();
              fd.set("organizationId", next);
              await switchOrganizationAction(fd);
            });
          }}
        >
          {organizations.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </ContextSelect>
      ) : null}

      {businessUnits.length ? (
        <ContextSelect
          id="bu-switcher"
          label="Business unit"
          value={bu}
          disabled={pending}
          onChange={(next) => {
            setBu(next);
            setRegion("");
            setSite("");
            setProject("");
            startTransition(async () => {
              const fd = new FormData();
              fd.set("organizationId", organizationId);
              fd.set("businessUnitId", next);
              await setBusinessUnitContextAction(fd);
            });
          }}
        >
          <option value="">All BUs</option>
          {businessUnits.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </ContextSelect>
      ) : null}

      {regions.length ? (
        <ContextSelect
          id="region-switcher"
          label="Region"
          value={region}
          disabled={pending}
          onChange={(next) => {
            setRegion(next);
            setSite("");
            setProject("");
            startTransition(async () => {
              const fd = new FormData();
              fd.set("organizationId", organizationId);
              fd.set("regionId", next);
              await setRegionContextAction(fd);
            });
          }}
        >
          <option value="">All regions</option>
          {filteredRegions.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name}
            </option>
          ))}
        </ContextSelect>
      ) : null}

      <ContextSelect
        id="site-switcher"
        label="Site"
        value={site}
        disabled={pending}
        onChange={(next) => {
          setSite(next);
          setProject("");
          startTransition(async () => {
            const fd = new FormData();
            fd.set("organizationId", organizationId);
            fd.set("siteId", next);
            await setSiteContextAction(fd);
          });
        }}
      >
        <option value="">All sites</option>
        {filteredSites.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </ContextSelect>

      <ContextSelect
        id="project-switcher"
        label="Project"
        value={project}
        disabled={pending}
        onChange={(next) => {
          setProject(next);
          startTransition(async () => {
            const fd = new FormData();
            fd.set("organizationId", organizationId);
            fd.set("projectId", next);
            await setProjectContextAction(fd);
          });
        }}
      >
        <option value="">All projects</option>
        {filteredProjects.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </ContextSelect>
    </div>
  );
}
