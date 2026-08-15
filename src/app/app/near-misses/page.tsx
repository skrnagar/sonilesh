import { EventList } from "@/components/events/event-list";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listEventsByType } from "@/lib/events/queries";

export default async function NearMissesPage() {
  const access = await requireModuleAccess({
    featureCode: "near_miss",
    permission: "near_miss.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Near Misses" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = await listEventsByType(
    access.supabase,
    access.organization.id,
    "near_miss",
  );

  return (
    <EventList
      title="Near Misses"
      createHref="/app/near-misses/new"
      baseHref="/app/near-misses"
      rows={rows as never}
    />
  );
}
