import Link from "next/link";
import { redirect } from "next/navigation";
import { INDUSTRIES } from "@/lib/services/organization";
import { requireUser } from "@/lib/auth/session";
import { createOrganizationAction } from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import {
  formatSupabaseUserError,
  isNetworkFetchError,
  isSchemaMissingError,
  setupRedirectPath,
} from "@/lib/supabase/errors";

export default async function OnboardingStartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("id, organizations:organization_id(onboarding_completed_at)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (
    membershipError &&
    (isSchemaMissingError(membershipError) || isNetworkFetchError(membershipError))
  ) {
    redirect(setupRedirectPath(membershipError));
  }

  const completed = memberships?.find((m) => {
    const org = m.organizations as unknown as { onboarding_completed_at?: string | null };
    return org?.onboarding_completed_at;
  });
  if (completed) redirect("/app/dashboard");

  const errorText = params.error ? formatSupabaseUserError(params.error) : null;
  const showSetupLink =
    errorText &&
    (isSchemaMissingError(errorText) ||
      isNetworkFetchError(errorText) ||
      errorText.includes("/setup"));

  return (
    <OnboardingShell
      step="Onboarding · Step 1"
      title="Create your organization"
      description="Signup → Organization → Industry → First site → Invite users → Select plan → Dashboard"
    >
      {errorText ? (
        <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <p>{errorText}</p>
          {showSetupLink ? (
            <p className="mt-2">
              <Link href="/setup" className="font-medium underline">
                Open setup status
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}
      <form action={createOrganizationAction} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Organization name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="industry">Industry</Label>
          <Select id="industry" name="industry" required defaultValue="">
            <option value="" disabled>
              Select industry
            </option>
            {INDUSTRIES.map((industry) => (
              <option key={industry} value={industry}>
                {industry}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="companyType">Company type</Label>
          <Input id="companyType" name="companyType" placeholder="EPC / Owner / Contractor" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input id="country" name="country" />
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
