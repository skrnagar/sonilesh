import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function FieldReportsPage() {
  return (
    <FieldScaffoldPage
      title="RAKSHA Reports"
      subtitle="Registers, filters, and exports for your site."
      action="raksha_reports"
      body="Full Raksha report packs and BI filters are available on desktop. Use Report Hub for UA/UC, incidents, site visits, action items, and MIS status exports."
      webHref="/app/reports/hub"
      webLabel="Open Report Hub"
    />
  );
}
