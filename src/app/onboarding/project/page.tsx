import { saveProjectStepAction } from "@/app/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { DEFAULT_PROJECT_TYPES } from "@/lib/constants/organization";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";
import { OnboardingError } from "@/components/onboarding/onboarding-error";

export default async function OnboardingProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { organization } = await requireOnboardingOrg(params.org ?? "");

  return (
    <OnboardingShell
      step="Step 7 · First project"
      title="Create your first project"
      description="Optional if your hierarchy does not use projects."
      organizationId={organization.id}
      currentStep="project"
    >
      <OnboardingError error={params.error} />
      <form action={saveProjectStepAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={organization.id} />
        <div className="space-y-2">
          <Label htmlFor="name">Project name</Label>
          <Input id="name" name="name" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Code</Label>
          <Input id="code" name="code" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="projectType">Project type</Label>
          <Select id="projectType" name="projectType" defaultValue={DEFAULT_PROJECT_TYPES[0].code}>
            {DEFAULT_PROJECT_TYPES.map((t) => (
              <option key={t.code} value={t.code}>
                {t.name}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="w-full">
          Save project & continue
        </Button>
        <Button type="submit" name="skip" value="1" variant="outline" className="w-full">
          Skip
        </Button>
      </form>
    </OnboardingShell>
  );
}
