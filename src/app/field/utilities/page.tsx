import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function FieldUtilitiesPage() {
  return (
    <FieldScaffoldPage
      title="Utilities"
      subtitle="Org tools and reference data."
      action="utilities"
      body="Bulk utilities, reference data, and admin tools are managed on desktop. Field users can continue reporting and inspections from the launchpad."
      webHref="/app/settings"
      webLabel="Open settings"
    />
  );
}
