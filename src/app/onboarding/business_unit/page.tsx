import { saveBusinessUnitStepAction } from "@/app/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";
import { OnboardingError } from "@/components/onboarding/onboarding-error";

export default async function OnboardingBusinessUnitPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { organization } = await requireOnboardingOrg(params.org ?? "");

  return (
    <OnboardingShell
      step="Step 5 · First business unit"
      title="Create your first business unit"
      description="Optional — skip if your organization goes straight to sites."
      organizationId={organization.id}
      currentStep="business_unit"
    >
      <OnboardingError error={params.error} />
      <form action={saveBusinessUnitStepAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={organization.id} />
        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" placeholder="Power Transmission" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" placeholder="PT" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Input id="description" name="description" />
        </div>
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
