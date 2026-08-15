import { ModuleShell } from "@/components/modules/module-shell";

export default function Page() {
  return (
    <ModuleShell
      title="Reports"
      description="Operational and compliance reports"
      featureCode="advanced_reports"
      permission="reports.view"
    />
  );
}
