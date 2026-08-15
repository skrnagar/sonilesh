import { EventCreateForm } from "@/components/events/event-create-form";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";

export default async function NewHazardPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const params = await searchParams;
  const type =
    params.type === "unsafe_act" || params.type === "unsafe_condition"
      ? params.type
      : "hazard";

  const access = await requireModuleAccess({
    featureCode: "hazard_reporting",
    permission: "hazards.create",
  });
  if (!access.entitled) return <UpgradeState featureName="Hazard Reporting" />;
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
      <h1 className="text-xl font-semibold text-primary">
        Report {type.replace("_", " ")}
      </h1>
      <EventCreateForm
        organizationId={access.organization.id}
        eventTypeCode={type}
        sites={sites ?? []}
        severities={severities ?? []}
      />
    </div>
  );
}
