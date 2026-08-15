import { inviteUsersAction } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  return (
    <OnboardingShell
      step="Onboarding · Step 3"
      title="Invite users"
      description="Add teammate emails now (optional). Roles can be assigned after they join."
    >
      <form action={inviteUsersAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={org || ""} />
        <div className="space-y-2">
          <Label htmlFor="emails">Emails</Label>
          <Textarea
            id="emails"
            name="emails"
            placeholder="ehs.manager@company.com, supervisor@company.com"
          />
        </div>
        <Button type="submit" className="w-full">
          Continue to plan selection
        </Button>
      </form>
    </OnboardingShell>
  );
}
