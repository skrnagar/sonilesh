import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { linkFindingCapaAction, updateFindingAction } from "@/app/actions/checklists";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listFindings } from "@/lib/services/checklists";

export default async function FindingsPage() {
  const access = await requireModuleAccess({
    featureCode: "inspections",
    permission: "findings.view",
  });
  // Allow via audits feature if inspections not entitled but audits is
  if (!access.entitled) {
    const audits = await requireModuleAccess({
      featureCode: "audits",
      permission: "findings.view",
    });
    if (!audits.entitled) return <UpgradeState featureName="Findings" />;
    if (!audits.permitted) return <ForbiddenState />;
  } else if (!access.permitted) {
    return <ForbiddenState />;
  }

  const rows = await listFindings(access.supabase, access.organization.id);
  const { data: categories } = await access.supabase
    .from("finding_categories")
    .select("id, code, name")
    .or(`organization_id.eq.${access.organization.id},organization_id.is.null`)
    .eq("is_active", true)
    .order("severity_rank", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Findings register</h1>
          <p className="text-sm text-muted-foreground">
            From inspections & audits — categorize, close, or link CAPA.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/inspections">Inspections</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/audits">Audits</Link>
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Finding</th>
              <th className="px-3 py-2">Source</th>
              <th className="px-3 py-2">Category</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-8 text-center text-muted-foreground">
                  No findings yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => {
                const asg = r.checklist_assignments as {
                  id?: string;
                  assignment_number?: string;
                  checklist_type?: string;
                } | null;
                const href =
                  asg?.checklist_type === "audit"
                    ? `/app/audits/${asg.id}`
                    : `/app/inspections/${asg?.id}`;
                return (
                  <tr key={r.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <p className="font-medium">{r.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {r.description || "—"}
                      </p>
                    </td>
                    <td className="px-3 py-2">
                      {asg?.id ? (
                        <Link href={href} className="text-accent hover:underline">
                          {asg.assignment_number}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {(r.finding_categories as { name?: string } | null)?.name ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <Badge variant="secondary" className="capitalize">
                        {r.status.replace(/_/g, " ")}
                      </Badge>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex flex-wrap gap-2">
                        <ActionForm action={updateFindingAction} className="flex gap-1">
                          <input type="hidden" name="organizationId" value={access.organization.id} />
                          <input type="hidden" name="findingId" value={r.id} />
                          <input type="hidden" name="assignmentId" value={asg?.id ?? ""} />
                          <Select name="categoryId" defaultValue="">
                            <option value="">Category</option>
                            {(categories ?? []).map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </Select>
                          <Select name="status" defaultValue={r.status}>
                            <option value="open">Open</option>
                            <option value="accepted">Accepted</option>
                            <option value="closed">Closed</option>
                            <option value="capa_linked">CAPA linked</option>
                          </Select>
                          <Button type="submit" size="sm" variant="outline">
                            Save
                          </Button>
                        </ActionForm>
                        {!r.capa_id ? (
                          <ActionForm action={linkFindingCapaAction}>
                            <input type="hidden" name="organizationId" value={access.organization.id} />
                            <input type="hidden" name="findingId" value={r.id} />
                            <input
                              type="hidden"
                              name="checklistType"
                              value={asg?.checklist_type ?? "inspection"}
                            />
                            <Button type="submit" size="sm">
                              CAPA
                            </Button>
                          </ActionForm>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
