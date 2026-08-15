import { EventList } from "@/components/events/event-list";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listEventsByType } from "@/lib/events/queries";

export default async function IncidentsPage() {
  const access = await requireModuleAccess({
    featureCode: "incident_management",
    permission: "incidents.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Incidents" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await listEventsByType(
    access.supabase,
    access.organization.id,
    "incident",
  );

  return (
    <EventList
      title="Incidents"
      createHref="/app/incidents/new"
      baseHref="/app/incidents"
      rows={rows as never}
    />
  );
}
