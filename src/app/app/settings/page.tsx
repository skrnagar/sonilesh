import { ModuleShell } from "@/components/modules/module-shell";

export default function Page() {
  return (
    <ModuleShell
      title="Settings"
      description="Organization configuration"
      permission="settings.manage"
    />
  );
}
