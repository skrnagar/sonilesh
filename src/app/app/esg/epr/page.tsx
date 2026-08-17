import { ActionForm } from "@/components/shared/action-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { saveEprAction } from "@/app/actions/esg";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { WASTE_STREAMS } from "@/lib/compliance/applicability";

export default async function EprPage() {
  const access = await requireModuleAccess({
    featureCode: "esg_reporting",
    permission: "esg.view",
  });
  if (!access.entitled) return <UpgradeState featureName="ESG / BRSR reporting" />;
  if (!access.permitted) return <ForbiddenState />;

  const { data: rows } = await access.supabase
    .from("epr_registrations")
    .select("*")
    .eq("organization_id", access.organization.id);
  const byStream = new Map((rows ?? []).map((row) => [row.waste_stream, row]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">EPR registrations</h1>
        <p className="text-sm text-muted-foreground">
          Plastic, e-waste, battery, hazardous, C&amp;D, ELV. Renewal dates should also appear on the
          compliance calendar once the applicability engine includes the matching annual obligation.
        </p>
      </div>
      {WASTE_STREAMS.map((stream) => {
        const row = byStream.get(stream);
        return (
          <ActionForm key={stream} action={saveEprAction} className="grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-3">
            <input type="hidden" name="wasteStream" value={stream} />
            <p className="md:col-span-3 font-medium capitalize">{stream.replaceAll("_", " ")}</p>
            <select
              name="registrationStatus"
              defaultValue={row?.registration_status ?? "not_registered"}
              className="rounded-md border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="not_registered">Not registered</option>
              <option value="registered">Registered</option>
              <option value="expired">Expired</option>
            </select>
            <Input name="annualTarget" type="number" placeholder="Annual target" defaultValue={row?.annual_target ?? ""} />
            <Input name="annualActual" type="number" placeholder="Annual actual" defaultValue={row?.annual_actual ?? ""} />
            <Input name="renewalDue" type="date" defaultValue={row?.renewal_due ?? ""} />
            <Input name="certificatePath" placeholder="Certificate URL" defaultValue={row?.certificate_path ?? ""} />
            <Button type="submit">Save</Button>
          </ActionForm>
        );
      })}
    </div>
  );
}
