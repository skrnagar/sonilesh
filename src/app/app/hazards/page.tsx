import Link from "next/link";
import { EventList } from "@/components/events/event-list";
import { Button } from "@/components/ui/button";
import { ForbiddenState, UpgradeState } from "@/components/shared/state-panels";
import { requireModuleAccess } from "@/lib/auth/org-context";
import { listEventsByTypes } from "@/lib/events/queries";

export default async function HazardsPage() {
  const access = await requireModuleAccess({
    featureCode: "hazard_reporting",
    permission: "hazards.view",
  });
  if (!access.entitled) return <UpgradeState featureName="Hazard Reporting" />;
  if (!access.permitted) return <ForbiddenState />;

  const rows = (
    await listEventsByTypes(access.supabase, access.organization.id, [
      "hazard",
      "unsafe_act",
      "unsafe_condition",
    ])
  ).sort((a, b) => +new Date(b.occurred_at) - +new Date(a.occurred_at));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link href="/app/hazards/new?type=hazard">Hazard</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/app/hazards/new?type=unsafe_act">Unsafe Act</Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link href="/app/hazards/new?type=unsafe_condition">Unsafe Condition</Link>
        </Button>
      </div>
      <EventList
        title="Hazards / UA / UC"
        createHref="/app/hazards/new?type=hazard"
        baseHref="/app/hazards"
        rows={rows as never}
      />
    </div>
  );
}
