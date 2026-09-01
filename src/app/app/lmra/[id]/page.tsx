import { notFound } from "next/navigation";
import { reviewLmraAction } from "@/app/actions/enterprise";
import { ActionForm } from "@/components/shared/action-form";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { StatusPill } from "@/components/modules/records-table";
import { ForbiddenState } from "@/components/shared/state-panels";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getUserPermissions } from "@/lib/services/rbac";
import { formatDate } from "@/lib/utils";

export default async function LmraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireModuleAccess({ permission: "lmra.view" });
  if (!access.permitted) return <ForbiddenState />;

  const { data: row } = await access.supabase
    .from("lmra_assessments")
    .select("*, sites:site_id(name), projects:project_id(name)")
    .eq("id", id)
    .eq("organization_id", access.organization.id)
    .maybeSingle();
  if (!row) notFound();

  const permissions = await getUserPermissions(
    access.supabase,
    access.organization.id,
    access.user.id,
  );
  const canApprove = permissions.includes("lmra.approve") && row.status === "submitted";

  return (
    <div className="space-y-5">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "LMRA", href: "/app/lmra" },
          { label: row.assessment_number },
        ]}
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">LMRA</p>
          <h1 className="text-xl font-semibold">{row.assessment_number}</h1>
        </div>
        <StatusPill value={row.status} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Activity</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm">{row.activity_description}</p>
          {row.immediate_action ? (
            <p className="mt-3 text-sm">
              <span className="font-medium">Immediate control: </span>
              {row.immediate_action}
            </p>
          ) : null}
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Site</dt>
              <dd>{(row.sites as { name?: string } | null)?.name ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Submitted</dt>
              <dd>{row.submitted_at ? formatDate(row.submitted_at) : "—"}</dd>
            </div>
          </dl>
        </section>
        {canApprove ? (
          <section className="rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">ESHO review</h2>
            <ActionForm action={reviewLmraAction} className="mt-3 space-y-3">
              <input type="hidden" name="assessmentId" value={row.id} />
              <div className="space-y-2">
                <Label htmlFor="reviewNotes">Review notes</Label>
                <Textarea id="reviewNotes" name="reviewNotes" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" name="decision" value="approved">
                  Approve
                </Button>
                <Button type="submit" name="decision" value="rejected" variant="outline">
                  Reject
                </Button>
              </div>
            </ActionForm>
          </section>
        ) : null}
      </div>
    </div>
  );
}
