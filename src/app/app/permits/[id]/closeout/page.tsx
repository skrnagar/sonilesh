import Link from "next/link";
import { notFound } from "next/navigation";
import { completeCloseoutAction, startCloseoutAction, updateChecklistItemAction } from "@/app/actions/permits";
import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getPermitBundle } from "@/lib/services/permits";

export default async function PermitCloseoutPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireModuleAccess({
    featureCode: "permit_to_work",
    permission: "permits.close",
  });
  if (!access.entitled) return <UpgradeState featureName="Permit to Work" />;
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getPermitBundle(access.supabase, access.organization.id, id);
  if (!bundle) notFound();
  const { permit, checklistItems, checklists, checklistGate } = bundle;
  const closeoutItems = checklistItems.filter((i) =>
    checklists.some((c) => c.purpose === "closeout" && c.id === i.checklist_id),
  );

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs uppercase text-muted-foreground">Close-out</p>
        <h1 className="text-xl font-semibold">{permit.permit_number}</h1>
        <p className="text-sm text-muted-foreground">{permit.title}</p>
      </div>

      {permit.status !== "closeout" ? (
        <ActionForm action={startCloseoutAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <input type="hidden" name="organizationId" value={access.organization.id} />
          <input type="hidden" name="permitId" value={permit.id} />
          <p className="text-sm text-muted-foreground">
            Start close-out to seed the close-out checklist (configurable examples — not universal
            legal requirements).
          </p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="workCompleted" /> Work completed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="areaRestored" /> Area restored
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="toolsRemoved" /> Tools removed
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="isolationsReleased" /> Isolations released
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" name="personnelAccounted" /> Personnel accounted
          </label>
          <Textarea name="notes" placeholder="Close-out notes" />
          <Button type="submit">Start close-out</Button>
        </ActionForm>
      ) : (
        <>
          <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Close-out checklist</h2>
            {closeoutItems.map((item) => (
              <ActionForm
                key={item.id}
                action={updateChecklistItemAction}
                className="flex flex-wrap items-center gap-2 border-b border-border py-2"
              >
                <input type="hidden" name="organizationId" value={access.organization.id} />
                <input type="hidden" name="permitId" value={permit.id} />
                <input type="hidden" name="itemId" value={item.id} />
                <span className="min-w-[12rem] flex-1 text-sm">{item.item_text}</span>
                <Select name="responseValue" defaultValue={item.response_value ?? ""}>
                  <option value="">—</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                  <option value="na">N/A</option>
                </Select>
                <Button type="submit" size="sm" variant="outline">
                  Save
                </Button>
              </ActionForm>
            ))}
            {!closeoutItems.length ? (
              <p className="text-sm text-muted-foreground">No close-out items — you may complete close-out.</p>
            ) : null}
          </section>

          <ActionForm action={completeCloseoutAction} className="space-y-3 rounded-2xl border border-border bg-card p-4">
            <input type="hidden" name="organizationId" value={access.organization.id} />
            <input type="hidden" name="permitId" value={permit.id} />
            <div className="space-y-1">
              <Label htmlFor="closeoutNotes">Final comments</Label>
              <Textarea id="closeoutNotes" name="closeoutNotes" />
            </div>
            {checklistGate.message && closeoutItems.length ? (
              <p className="text-sm text-amber-700 dark:text-amber-300">{checklistGate.message}</p>
            ) : null}
            <Button type="submit">Close permit</Button>
          </ActionForm>
        </>
      )}

      <Button asChild variant="outline" size="sm">
        <Link href={`/app/permits/${permit.id}`}>Back to permit</Link>
      </Button>
    </div>
  );
}
