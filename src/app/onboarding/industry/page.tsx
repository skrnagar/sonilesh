import { saveIndustryStepAction } from "@/app/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { INDUSTRIES } from "@/lib/constants/organization";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";
import { OnboardingError } from "@/components/onboarding/onboarding-error";

export default async function OnboardingIndustryPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { organization } = await requireOnboardingOrg(params.org ?? "");

  return (
    <OnboardingShell
      step="Step 3 · Industry"
      title="Confirm your industry"
      description="Industry drives default terminology and future EHS configuration suggestions."
      organizationId={organization.id}
      currentStep="industry"
    >
      <OnboardingError error={params.error} />
      <form action={saveIndustryStepAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={organization.id} />
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select id="industry" name="industry" required defaultValue="">
            <option value="" disabled>
              Select
            </option>
            {INDUSTRIES.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="otherIndustry">If Other, specify</Label>
          <Input id="otherIndustry" name="otherIndustry" />
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
