import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function IaTrackerPage() {
  return (
    <FieldScaffoldPage
      title="IA Tracker"
      subtitle="Internal audit tracking"
      action="my_zone"
      body="Internal audit tracking for field users is coming soon. Audit schedules and findings will be accessible from this hub."
      webHref="/app/audits"
      webLabel="Open audits on desktop"
    />
  );
}
