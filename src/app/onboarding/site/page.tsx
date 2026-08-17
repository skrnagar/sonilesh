import { createFirstSiteAction } from "@/app/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";
import { OnboardingError } from "@/components/onboarding/onboarding-error";

export default async function OnboardingSitePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { organization } = await requireOnboardingOrg(params.org ?? "");

  return (
    <OnboardingShell
      step="Step 6 · First site"
      title="Add your first site"
      description="Sites are the primary operational context for future EHS modules."
      organizationId={organization.id}
      currentStep="site"
    >
      <OnboardingError error={params.error} />
      <form action={createFirstSiteAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={organization.id} />
        <div className="space-y-2">
          <Label htmlFor="name">Site name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Site code</Label>
          <Input id="code" name="code" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteType">Site type</Label>
          <Select id="siteType" name="siteType" defaultValue="permanent">
            <option value="permanent">Permanent</option>
            <option value="temporary_project">Temporary project site</option>
          </Select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input id="city" name="city" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" name="country" />
          </div>
        </div>
        <Button type="submit" className="w-full">
          Save site & continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
