import { EventCreateForm } from "@/components/events/event-create-form";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function NewNearMissPage() {
  const access = await requireModuleAccess({
    featureCode: "near_miss",
    permission: "near_miss.create",
  });
  if (!access.entitled) return <UpgradeState featureName="Near Misses" />;
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
      <h1 className="text-xl font-semibold text-primary">Report near miss</h1>
      <EventCreateForm
        organizationId={access.organization.id}
        eventTypeCode="near_miss"
        sites={sites ?? []}
        severities={severities ?? []}
      />
    </div>
  );
}
