import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StatusPill } from "@/components/modules/records-table";
import { ForbiddenState } from "@/components/shared/state-panels";
import { SiteVisitWorkflowBar } from "@/components/site-visits/site-visit-workflow-bar";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getUserPermissions } from "@/lib/services/rbac";
import type { VisitStatus } from "@/lib/services/site-visits";
import { formatDate } from "@/lib/utils";

export default async function SiteVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireModuleAccess({ permission: "visits.view" });
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: row }, permissions, membersRes] = await Promise.all([
    access.supabase
      .from("site_visits")
      .select("*, sites:site_id(name), regions:region_id(name)")
      .eq("id", id)
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null)
      .maybeSingle(),
    getUserPermissions(access.supabase, access.organization.id, access.user.id),
    access.supabase
      .from("organization_members")
      .select("user_id, profiles:user_id(id, full_name, email)")
      .eq("organization_id", access.organization.id)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(50),
  ]);

  if (!row) notFound();

  const assignees = (membersRes.data ?? []).map((m) => {
    const p = m.profiles as { id?: string; full_name?: string; email?: string } | null;
    return { id: p?.id ?? m.user_id, name: p?.full_name || p?.email || "Member" };
  });

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "Site visits", href: "/app/site-visits" },
          { label: row.visit_number },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {row.visit_type.toUpperCase()} visit
          </p>
          <h1 className="text-xl font-semibold">{row.visit_number}</h1>
        </div>
        <StatusPill value={row.status} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Visit details</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{row.summary || "No summary"}</p>
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Site</dt>
              <dd>{(row.sites as { name?: string } | null)?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Region</dt>
              <dd>{(row.regions as { name?: string } | null)?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Visit date</dt>
              <dd>{formatDate(row.visit_date)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Findings</dt>
              <dd>{row.findings_count ?? 0}</dd>
            </div>
          </dl>
        </section>
        <SiteVisitWorkflowBar
          visitId={row.id}
          status={row.status as VisitStatus}
          permissions={permissions}
          assignees={assignees}
        />
      </div>
    </div>
  );
}
