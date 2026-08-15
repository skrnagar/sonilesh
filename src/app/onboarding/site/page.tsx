import { createFirstSiteAction } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingSitePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  return (
    <OnboardingShell
      step="Onboarding · Step 2"
      title="Create your first site"
      description="Sites are tenant-scoped and count against plan limits via the entitlement engine."
    >
      <form action={createFirstSiteAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={org || ""} />
        <div className="space-y-2">
          <Label htmlFor="name">Site name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="code">Site code</Label>
          <Input id="code" name="code" required placeholder="SITE01" />
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
