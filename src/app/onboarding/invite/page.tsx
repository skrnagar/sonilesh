import { inviteUsersAction } from "@/app/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { INVITE_ROLE_CODES } from "@/lib/constants/organization";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";
import { OnboardingError } from "@/components/onboarding/onboarding-error";

export default async function OnboardingInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { organization } = await requireOnboardingOrg(params.org ?? "");

  return (
    <OnboardingShell
      step="Step 8 · Invite users"
      title="Invite your EHS team"
      description="Optional. Invitations use a secure token with configurable expiry."
      organizationId={organization.id}
      currentStep="invite"
    >
      <OnboardingError error={params.error} />
      <form action={inviteUsersAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={organization.id} />
        <div className="space-y-2">
          <Label htmlFor="emails">Emails (comma or newline separated)</Label>
          <Textarea id="emails" name="emails" rows={4} placeholder="ehs@company.com" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="roleCode">Default role</Label>
          <Select id="roleCode" name="roleCode" defaultValue="ehs_officer">
            {INVITE_ROLE_CODES.map((code) => (
              <option key={code} value={code}>
                {code.replace(/_/g, " ")}
              </option>
            ))}
          </Select>
        </div>
        <Button type="submit" className="w-full">
          Send invites & continue
        </Button>
        <Button type="submit" name="skip" value="1" variant="outline" className="w-full">
          Skip for now
        </Button>
      </form>
    </OnboardingShell>
  );
}
