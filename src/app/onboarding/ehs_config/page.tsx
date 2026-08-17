import { saveEhsConfigStepAction } from "@/app/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";
import { OnboardingError } from "@/components/onboarding/onboarding-error";

export default async function OnboardingEhsConfigPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { organization } = await requireOnboardingOrg(params.org ?? "");

  return (
    <OnboardingShell
      step="Step 9 · EHS configuration"
      title="Baseline EHS preferences"
      description="You can refine risk matrices and reporting later. Incident modules are not enabled in this phase."
      organizationId={organization.id}
      currentStep="ehs_config"
    >
      <OnboardingError error={params.error} />
      <form action={saveEhsConfigStepAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={organization.id} />
        <div className="space-y-2">
          <Label htmlFor="primaryColor">Primary brand color</Label>
          <Input id="primaryColor" name="primaryColor" placeholder="#0b3a53" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ehsNotes">Notes</Label>
          <Input id="ehsNotes" name="ehsNotes" placeholder="ISO 45001 aligned program…" />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="allowAnonymous" />
          Allow anonymous reporting later
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="seedDepartments" defaultChecked />
          Seed EHS + Operations departments
        </label>
        <Button type="submit" className="w-full">
          Save & continue
        </Button>
        <Button type="submit" name="skip" value="1" variant="outline" className="w-full">
          Skip
        </Button>
      </form>
    </OnboardingShell>
  );
}
