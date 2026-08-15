import { QuickReportForm } from "@/components/field/quick-report-form";
import { submitFieldReportAction } from "@/app/actions/field";

export default function FieldNearMissPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Report near miss</h1>
      <QuickReportForm mode="near-miss" action={submitFieldReportAction} />
    </div>
  );
}
