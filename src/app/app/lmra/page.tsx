import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ModuleShell } from "@/components/modules/module-shell";
import { StatusPill } from "@/components/modules/records-table";
import { EmptyState } from "@/components/shared/state-panels";
import { Button } from "@/components/ui/button";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listLmraAssessments } from "@/lib/services/lmra";
import { formatDate } from "@/lib/utils";

export default async function LmraListPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const access = await requireModuleAccess({ permission: "lmra.view" });
  const status = params.status as "draft" | "submitted" | "approved" | "rejected" | undefined;
  const rows =
    access.permitted
      ? await listLmraAssessments(access.supabase, access.organization.id, { status })
      : [];

  return (
    <ModuleShell title="LMRA" description="Last Minute Risk Assessments with ESHO approval workflow." permission="lmra.view">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/app/home" },
          { label: "LMRA" },
        ]}
        className="mb-4"
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Button asChild variant={!status ? "default" : "outline"} size="sm">
          <Link href="/app/lmra">All</Link>
        </Button>
        <Button asChild variant={status === "submitted" ? "default" : "outline"} size="sm">
          <Link href="/app/lmra?status=submitted">Pending approval</Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/field/lmra">Field capture</Link>
        </Button>
      </div>
      {rows.length ? (
        <div className="overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
              <tr>
                <th className="px-4 py-2">Number</th>
                <th className="px-4 py-2">Activity</th>
                <th className="px-4 py-2">Site</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Submitted</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <Link href={`/app/lmra/${row.id}`} className="font-medium text-accent hover:underline">
                      {row.assessment_number}
                    </Link>
                  </td>
                  <td className="max-w-xs truncate px-4 py-3">{row.activity_description}</td>
                  <td className="px-4 py-3">{(row.sites as { name?: string } | null)?.name ?? "—"}</td>
                  <td className="px-4 py-3">
                    <StatusPill value={row.status} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.submitted_at ? formatDate(row.submitted_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          title="No LMRA records"
          description="Submit from Field app or create here when the workflow is enabled for your tenant."
        />
      )}
    </ModuleShell>
  );
}
