import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveRegulatoryUpdateAction, saveUpdateImpactAction } from "@/app/actions/legal-register";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listLegalRegister } from "@/lib/services/legal-register";

export default async function ReviewsPage() {
  const access = await requireModuleAccess({
    featureCode: "legal_register",
    permission: "legal_register.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Legal register" />;
  if (!access.permitted) return <ForbiddenState />;

  const [updates, impacts, entries] = await Promise.all([
    access.supabase
      .from("regulatory_updates")
      .select("id, title, summary, published_on, status, source_url")
      .or(`organization_id.eq.${access.organization.id},organization_id.is.null`)
      .order("created_at", { ascending: false })
      .limit(50),
    access.supabase
      .from("regulatory_update_impacts")
      .select("id, impact_status, notes, update_id, legal_register_entry_id")
      .eq("organization_id", access.organization.id),
    listLegalRegister(access.supabase, access.organization.id, access.siteId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Regulatory change reviews</h1>
        <p className="text-sm text-muted-foreground">
          Workflow only — this is not live legal monitoring. Record a circular or update, then mark
          impact against register entries.
        </p>
      </div>
      <ActionForm action={saveRegulatoryUpdateAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4">
        <div>
          <Label htmlFor="title">Update title</Label>
          <Input id="title" name="title" required />
        </div>
        <div>
          <Label htmlFor="summary">Summary</Label>
          <Input id="summary" name="summary" />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <Label htmlFor="publishedOn">Published on</Label>
            <Input id="publishedOn" name="publishedOn" type="date" />
          </div>
          <div>
            <Label htmlFor="sourceUrl">Source URL</Label>
            <Input id="sourceUrl" name="sourceUrl" />
          </div>
        </div>
        <Button type="submit">Record update</Button>
      </ActionForm>
      <ul className="space-y-3">
        {(updates.data ?? []).map((row) => (
          <li key={row.id} className="rounded-2xl border border-border bg-card p-4 text-sm">
            <p className="font-medium">{row.title}</p>
            <p className="text-xs text-muted-foreground">
              {row.published_on ?? "undated"} · {row.status}
              {row.source_url ? ` · ${row.source_url}` : ""}
            </p>
            {row.summary ? <p className="mt-1">{row.summary}</p> : null}
            <ActionForm action={saveUpdateImpactAction} className="mt-3 grid gap-2 md:grid-cols-3">
              <input type="hidden" name="updateId" value={row.id} />
              <Select name="legalRegisterEntryId" defaultValue="">
                <option value="">Register entry</option>
                {entries.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.title}
                  </option>
                ))}
              </Select>
              <Select name="impactStatus" defaultValue="pending_review">
                <option value="pending_review">Pending review</option>
                <option value="applicable">Applicable</option>
                <option value="not_applicable">Not applicable</option>
                <option value="actioned">Actioned</option>
              </Select>
              <Button type="submit" size="sm" variant="outline">
                Save impact
              </Button>
            </ActionForm>
            <ul className="mt-2 list-disc pl-5 text-xs text-muted-foreground">
              {(impacts.data ?? [])
                .filter((i) => i.update_id === row.id)
                .map((i) => (
                  <li key={i.id}>
                    {i.impact_status}
                    {i.notes ? ` — ${i.notes}` : ""}
                  </li>
                ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
