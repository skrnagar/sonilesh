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

export default async function AuditsPage() {
  const access = await requireModuleAccess({
    featureCode: "audits",
    permission: "audits.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Audits" />;
  if (!access.permitted) return <ForbiddenState />;

  await ensureDefaultTemplates(access.supabase, access.organization.id, access.user.id).catch(
    () => undefined,
  );

  const [templates, rows, metrics, sites] = await Promise.all([
    listTemplates(access.supabase, access.organization.id, "audit"),
    listAssignments(access.supabase, access.organization.id, { checklistType: "audit" }),
    getChecklistMetrics(access.supabase, access.organization.id, "audit"),
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
          <h1 className="text-xl font-semibold">Audits</h1>
          <p className="text-sm text-muted-foreground">
            Same checklist engine as inspections (type=audit) — findings, CAPA, review, report.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/app/findings">Findings</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/app/inspections">Inspections</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Open", metrics.open],
          ["Completed", metrics.completed],
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
            Seed default audit template
          </Button>
        </ActionForm>
      ) : null}

      <ActionForm
        action={createAssignmentAction}
        className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3"
      >
        <input type="hidden" name="organizationId" value={access.organization.id} />
        <input type="hidden" name="checklistType" value="audit" />
        <div className="space-y-1 md:col-span-2">
          <Label htmlFor="title">Audit title</Label>
          <Input id="title" name="title" required />
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
          <Label htmlFor="scheduledFor">Planned date</Label>
          <Input id="scheduledFor" name="scheduledFor" type="date" />
        </div>
        <Button type="submit" className="w-fit self-end">
          Plan audit
        </Button>
      </ActionForm>

      <div className="overflow-x-auto rounded-2xl border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-3 py-2">Number</th>
              <th className="px-3 py-2">Title</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-8 text-center text-muted-foreground">
                  No audits yet.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-3 py-2">
                    <Link href={`/app/audits/${r.id}`} className="font-medium text-accent hover:underline">
                      {r.assignment_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{r.title}</td>
                  <td className="px-3 py-2">
                    <Badge variant="secondary" className="capitalize">
                      {String(r.status).replace(/_/g, " ")}
                    </Badge>
                  </td>
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
