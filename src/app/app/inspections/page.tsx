import Link from "next/link";
import { ActionForm } from "@/components/shared/action-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { createAssignmentAction, seedChecklistTemplatesAction } from "@/app/actions/checklists";
import { requireModuleAccess } from "@/lib/auth/org-context";
import {
  ensureDefaultTemplates,
  getChecklistMetrics,
  listAssignments,
  listTemplates,
} from "@/lib/services/checklists";

export default async function InspectionsPage() {
  const access = await requireModuleAccess({
    featureCode: "inspections",
    permission: "inspections.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Inspections" />;
  if (!access.permitted) return <ForbiddenState />;

  await ensureDefaultTemplates(access.supabase, access.organization.id, access.user.id).catch(
    () => undefined,
  );

  const [templates, rows, metrics, sites] = await Promise.all([
    listTemplates(access.supabase, access.organization.id, "inspection"),
    listAssignments(access.supabase, access.organization.id, {
      checklistType: "inspection",
    }),
    getChecklistMetrics(access.supabase, access.organization.id, "inspection"),
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Inspections</h1>
          <p className="text-sm text-muted-foreground">
            Shared checklist engine (type=inspection) — findings feed CAPA.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/findings">Findings</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/settings/ehs/checklists">Templates</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/audits">Audits</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Open", metrics.open],
          ["Completed", metrics.completed],
          ["Overdue", metrics.overdue],
          ["Avg score", metrics.avgScore != null ? `${metrics.avgScore}%` : "—"],
          ["Findings", metrics.openFindings],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border bg-card p-3">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-xl font-semibold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      {!templates.length ? (
        <ActionForm action={seedChecklistTemplatesAction}>
          <input type="hidden" name="organizationId" value={access.organization.id} />
          <Button type="submit" variant="outline">
            Seed default templates
          </Button>
        </ActionForm>
      ) : null}

      <ActionForm
        action={createAssignmentAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3"
      >
        <input type="hidden" name="organizationId" value={access.organization.id} />
        <input type="hidden" name="checklistType" value="inspection" />
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" name="title" required placeholder="Inspection title" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="templateId">Template</Label>
          <Select id="templateId" name="templateId" required defaultValue={templates[0]?.id ?? ""}>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="siteId">Site</Label>
          <Select id="siteId" name="siteId" defaultValue="">
            <option value="">Optional</option>
            {(sites.data ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="scheduledFor">Scheduled</Label>
          <Input id="scheduledFor" name="scheduledFor" type="date" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="dueDate">Due</Label>
          <Input id="dueDate" name="dueDate" type="date" />
        </div>
        <Button type="submit" className="w-fit self-end">
          Schedule inspection
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Template</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Scheduled</th>
              <th className="px-3 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-muted-foreground">
                  No inspections yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link
                      href={`/app/inspections/${r.id}`}
                      className="font-medium text-accent hover:underline"
                    >
                      {r.assignment_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">
                    {(r.checklist_templates as { name?: string } | null)?.name ?? "—"}
                  </td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className="capitalize">
                      {String(r.status).replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">{r.scheduled_for ?? "—"}</td>
                  <td className="px-3 py-2">
                    {r.score_percent != null ? `${r.score_percent}%` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
