import { ModuleShell } from "@/components/modules/module-shell";

export default function Page() {
  return (
    <ModuleShell
      title="Analytics"
      description="Advanced EHS analytics"
      featureCode="advanced_analytics"
      permission="analytics.view"
    />
  );
}
