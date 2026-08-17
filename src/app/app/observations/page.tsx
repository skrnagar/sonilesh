import { EventList } from "@/components/events/event-list";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listEventsByType } from "@/lib/events/queries";

export default async function ObservationsPage() {
  const access = await requireModuleAccess({
    featureCode: "hazard_reporting",
    permission: "hazards.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Observations" />;
  if (!access.permitted) return <ForbiddenState />;

  const [unsafeActs, unsafeConditions, observations] = await Promise.all([
    listEventsByType(access.supabase, access.organization.id, "unsafe_act"),
    listEventsByType(access.supabase, access.organization.id, "unsafe_condition"),
    listEventsByType(access.supabase, access.organization.id, "safety_observation"),
  ]);

  const rows = [...unsafeActs, ...unsafeConditions, ...observations].sort(
    (a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at),
  );

  return (
    <EventList
      title="Observations"
      createHref="/app/reports/new"
      baseHref="/app/observations"
      rows={rows as never}
    />
  );
}
