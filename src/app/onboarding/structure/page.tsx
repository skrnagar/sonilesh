import { saveStructureStepAction } from "@/app/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";
import { OnboardingError } from "@/components/onboarding/onboarding-error";

export default async function OnboardingStructurePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { organization } = await requireOnboardingOrg(params.org ?? "");

  return (
    <OnboardingShell
      step="Step 4 · Organization structure"
      title="Which hierarchy levels do you use?"
      description="Every level is optional. You can change this later in organization settings."
      organizationId={organization.id}
      currentStep="structure"
    >
      <OnboardingError error={params.error} />
      <form action={saveStructureStepAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={organization.id} />
        {(
          [
            ["useBusinessUnits", "Business units"],
            ["useProjects", "Projects"],
            ["useDepartments", "Departments"],
            ["useLocations", "Locations"],
          ] as const
        ).map(([name, label]) => (
          <label key={name} className="flex items-center gap-2 text-sm">
            <input type="checkbox" name={name} defaultChecked />
            {label}
          </label>
        ))}
        <Button type="submit" className="w-full">
          Continue
        </Button>
        <Button type="submit" name="skip" value="1" variant="outline" className="w-full">
          Skip for now
        </Button>
      </form>
    </OnboardingShell>
  );
}
