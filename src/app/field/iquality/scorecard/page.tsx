import { FieldScaffoldPage } from "@/components/field/field-scaffold-page";

export default function IQualityScorecardPage() {
  return (
    <FieldScaffoldPage
      title="Scorecard"
      subtitle="Quality performance scorecard"
      action="ehs_score"
      body="Quality scorecard views are being connected to iQuality. Use the EHS Scorecard module for dimensional scoring in the meantime."
      webHref="/field/ehs-score"
      webLabel="Open EHS Scorecard"
    />
  );
}
