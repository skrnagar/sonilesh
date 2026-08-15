import { EventCreateForm } from "@/components/events/event-create-form";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function NewIncidentPage() {
  const access = await requireModuleAccess({
    featureCode: "incident_management",
    permission: "incidents.create",
  });
  if (!access.entitled) return <UpgradeState featureName="Incidents" />;
  if (!access.permitted) return <ForbiddenState />;

  const [{ data: sites }, { data: severities }] = await Promise.all([
    access.supabase
      .from("sites")
      .select("id, name")
      .eq("organization_id", access.organization.id)
      .is("deleted_at", null),
    access.supabase
      .from("severity_levels")
      .select("id, name")
      .is("organization_id", null)
      .eq("is_active", true)
      .order("rank"),
  ]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-primary">Report incident</h1>
        <p className="text-sm text-muted-foreground">
          Shared reporting engine with automatic numbering, duplicate warnings and audit trail.
        </p>
      </div>
      <EventCreateForm
        organizationId={access.organization.id}
        eventTypeCode="incident"
        sites={sites ?? []}
        severities={severities ?? []}
      />
    </div>
  );
}
