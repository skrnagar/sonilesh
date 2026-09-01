import { createMisAction, reviewMisAction } from "@/app/actions/enterprise";

import { ActionForm } from "@/components/shared/action-form";

import { Breadcrumbs } from "@/components/layout/breadcrumbs";

import { ModuleShell } from "@/components/modules/module-shell";

import { StatusPill } from "@/components/modules/records-table";

import { ScopeFilters } from "@/components/dashboard/scope-filters";

import { Button } from "@/components/ui/button";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { EmptyState } from "@/components/shared/state-panels";

import { requireModuleAccess } from "@/lib/auth/org-context";

import { getUserPermissions } from "@/lib/services/rbac";

import { ensureMisPeriod, listMisSubmissions } from "@/lib/services/mis";

import { formatDate } from "@/lib/utils";

import { Suspense } from "react";



export default async function MisPage({

  searchParams,

}: {

  searchParams: Promise<{

    businessUnitId?: string;

    regionId?: string;

    projectId?: string;

    siteId?: string;

    dateFrom?: string;

    dateTo?: string;

    status?: string;

  }>;

}) {

  const params = await searchParams;

  const access = await requireModuleAccess({ permission: "mis.view" });



  const [{ data: bus }, { data: regions }, { data: sites }, { data: projects }, permissions] =

    await Promise.all([

      access.supabase

        .from("business_units")

        .select("id, name")

        .eq("organization_id", access.organization.id)

        .is("deleted_at", null)

        .order("name"),

      access.supabase

        .from("regions")

        .select("id, name")

        .eq("organization_id", access.organization.id)

        .is("deleted_at", null)

        .order("name"),

      access.supabase

        .from("sites")

        .select("id, name")

        .eq("organization_id", access.organization.id)

        .is("deleted_at", null)

        .order("name"),

      access.supabase

        .from("projects")

        .select("id, name")

        .eq("organization_id", access.organization.id)

        .is("deleted_at", null)

        .order("name"),

      getUserPermissions(access.supabase, access.organization.id, access.user.id),

    ]);



  const period = access.permitted

    ? await ensureMisPeriod(access.supabase, access.organization.id, access.user.id).catch(() => null)

    : null;



  const rows = access.permitted

    ? await listMisSubmissions(access.supabase, access.organization.id, {

        status: params.status as "draft" | "submitted" | "approved" | "rejected" | undefined,

        businessUnitId: params.businessUnitId,

        regionId: params.regionId,

        siteId: params.siteId,

        projectId: params.projectId,

      })

    : [];



  const canCreate = permissions.includes("mis.create");

  const canApprove = permissions.includes("mis.approve");



  return (

    <ModuleShell

      title="EHS MIS"

      description="Online Management Information System with BU / Region / Project filters."

      permission="mis.view"

    >

      <Breadcrumbs items={[{ label: "Home", href: "/app/home" }, { label: "EHS MIS" }]} className="mb-4" />

      <div className="mb-4 flex flex-wrap items-center gap-2">

        <Suspense fallback={null}>

          <ScopeFilters

            params={{ ...params, range: "monthly" }}

            sites={sites ?? []}

            projects={projects ?? []}

            departments={[]}

            bus={bus ?? []}

            regions={regions ?? []}

            severities={[]}

            owners={[]}

            actionPath="/app/mis"

          />

        </Suspense>

        {period ? (

          <span className="text-xs text-muted-foreground">Period: {period.label}</span>

        ) : null}

      </div>



      {canCreate && period ? (

        <ActionForm action={createMisAction} className="mb-6 space-y-3 rounded-2xl border border-border bg-card p-4">

          <input type="hidden" name="periodId" value={period.id} />

          <input type="hidden" name="businessUnitId" value={params.businessUnitId ?? ""} />

          <input type="hidden" name="regionId" value={params.regionId ?? ""} />

          <input type="hidden" name="siteId" value={params.siteId ?? ""} />

          <input type="hidden" name="projectId" value={params.projectId ?? ""} />

          <h2 className="text-sm font-semibold">New MIS submission</h2>

          <div className="space-y-1">

            <Label htmlFor="summary">Summary</Label>

            <Textarea id="summary" name="summary" required rows={3} placeholder="Monthly safety performance summary" />

          </div>

          <div className="flex gap-2">

            <Button type="submit" name="submit" value="false" variant="outline">

              Save draft

            </Button>

            <Button type="submit" name="submit" value="true">

              Submit for approval

            </Button>

          </div>

        </ActionForm>

      ) : null}



      {rows.length ? (

        <div className="overflow-hidden rounded-2xl border border-border">

          <table className="w-full text-sm">

            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">

              <tr>

                <th className="px-4 py-2">Number</th>

                <th className="px-4 py-2">Period</th>

                <th className="px-4 py-2">Scope</th>

                <th className="px-4 py-2">Status</th>

                <th className="px-4 py-2">Submitted</th>

                <th className="px-4 py-2">Actions</th>

              </tr>

            </thead>

            <tbody>

              {rows.map((row) => (

                <tr key={row.id} className="border-t border-border hover:bg-muted/20">

                  <td className="px-4 py-3 font-medium">{row.submission_number}</td>

                  <td className="px-4 py-3">

                    {(row.mis_periods as { label?: string } | null)?.label ?? "—"}

                  </td>

                  <td className="px-4 py-3 text-muted-foreground">

                    {(row.regions as { name?: string } | null)?.name ??

                      (row.sites as { name?: string } | null)?.name ??

                      "Organization"}

                  </td>

                  <td className="px-4 py-3">

                    <StatusPill value={row.status} />

                  </td>

                  <td className="px-4 py-3 text-muted-foreground">

                    {row.submitted_at ? formatDate(row.submitted_at) : "—"}

                  </td>

                  <td className="px-4 py-3">

                    {canApprove && row.status === "submitted" ? (

                      <ActionForm action={reviewMisAction} className="flex gap-1">

                        <input type="hidden" name="submissionId" value={row.id} />

                        <Button type="submit" name="decision" value="approved" size="sm">

                          Approve

                        </Button>

                        <Button type="submit" name="decision" value="rejected" size="sm" variant="outline">

                          Reject

                        </Button>

                      </ActionForm>

                    ) : (

                      <span className="text-xs text-muted-foreground">—</span>

                    )}

                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      ) : (

        <EmptyState

          title="No MIS submissions yet"

          description="Safety Officers create monthly MIS submissions here. BU EHS Head approves submitted records."

        />

      )}

    </ModuleShell>

  );

}

