import Link from "next/link";
import { notFound } from "next/navigation";
import { FieldSiteVisitWorkflow } from "@/components/field/field-site-visit-workflow";
import {
  FieldCard,
  FieldForbidden,
  FieldPageHeader,
  fieldPrimaryBtnClass,
} from "@/components/field/field-ui";
import { canFieldAction } from "@/lib/auth/field-roles";
import { requireOrgContext } from "@/lib/auth/org-context";
import { resolveFieldRole } from "@/lib/field/resolve-role";
import { getUserPermissions } from "@/lib/services/rbac";
import type { VisitStatus } from "@/lib/services/site-visits";
import { formatDate } from "@/lib/utils";

export default async function FieldSiteVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireOrgContext();
  const role = await resolveFieldRole(access.supabase, access.membershipId);
  if (!canFieldAction(role, "site_visit")) return <FieldForbidden />;

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
  if (!permissions.includes("visits.view")) return <FieldForbidden />;

  const assignees = (membersRes.data ?? []).map((m) => {
    const p = m.profiles as { id?: string; full_name?: string; email?: string } | null;
    return { id: p?.id ?? m.user_id, name: p?.full_name || p?.email || "Member" };
  });

  return (
    <div className="space-y-4">
      <FieldPageHeader
        title={row.visit_number}
        subtitle={`${row.visit_type.toUpperCase()} visit · ${String(row.status).replaceAll("_", " ")}`}
      />

      <FieldCard className="space-y-2">
        <p className="whitespace-pre-wrap text-sm text-foreground">{row.summary || "No summary"}</p>
        <dl className="grid grid-cols-2 gap-2 text-sm">
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
      </FieldCard>

      <FieldSiteVisitWorkflow
        visitId={row.id}
        status={row.status as VisitStatus}
        permissions={permissions}
        assignees={assignees}
      />

      <Link href="/field/site-visits" className={`${fieldPrimaryBtnClass} block text-center`}>
        Back to site visits
      </Link>
    </div>
  );
}
