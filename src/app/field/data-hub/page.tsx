import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function DataHubPage() {
  return (
    <FieldScaffoldPage
      title="Data Hub"
      subtitle="EHS analytics and BI"
      action="my_zone"
      body="EHS analytics dashboards and BI views are being connected to the field experience. Use the EHS Scorecard and MIS modules in the meantime, or open the full analytics workspace on desktop."
      webHref="/app/analytics"
      webLabel="Open analytics on desktop"
    />
  );
}
