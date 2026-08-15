import { notFound } from "next/navigation";
import { saveInvestigationAction } from "@/app/actions/events";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { getEventBundle } from "@/lib/events/queries";

export default async function InvestigationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const access = await requireModuleAccess({
    featureCode: "incident_management",
    permission: "incidents.investigate",
  });
  if (!access.entitled) return <UpgradeState featureName="Incidents" />;
  if (!access.permitted) return <ForbiddenState />;

  const bundle = await getEventBundle(
    access.supabase,
    access.organization.id,
    id,
  );
  if (!bundle) notFound();

  const investigation = bundle.investigation;

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-primary">Investigation workspace</h1>
        <p className="text-sm text-muted-foreground">
          {bundle.event.event_number} · Root cause methods: 5-Why / Fishbone / Free text
        </p>
      </div>
      <form action={saveInvestigationAction} className="space-y-4 border border-border bg-card p-5">
        <input type="hidden" name="organizationId" value={access.organization.id} />
        <input type="hidden" name="eventId" value={id} />
        <div className="space-y-2">
          <Label htmlFor="method">Method</Label>
          <Select id="method" name="method" defaultValue={investigation?.method ?? "5_why"}>
            <option value="5_why">5-Why</option>
            <option value="fishbone">Fishbone</option>
            <option value="free_text">Free text</option>
            <option value="other">Other</option>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="rootCause">Root cause</Label>
          <Textarea
            id="rootCause"
            name="rootCause"
            defaultValue={investigation?.root_cause ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="narrative">Investigation narrative</Label>
          <Textarea
            id="narrative"
            name="narrative"
            defaultValue={investigation?.narrative ?? ""}
          />
        </div>
        <Button type="submit">Save investigation</Button>
      </form>
    </div>
  );
}
