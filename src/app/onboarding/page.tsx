import Link from "next/link";
import { redirect } from "next/navigation";
import { INDUSTRIES, COMPANY_SIZES } from "@/lib/constants/organization";
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
import { resumeOnboardingPath } from "@/lib/services/onboarding-progress";

export default async function OnboardingStartPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; org?: string }>;
}) {
  const params = await searchParams;
  const { supabase, user } = await requireUser();
  const { data: memberships, error: membershipError } = await supabase
    .from("organization_members")
    .select("id, organization_id, organizations:organization_id(onboarding_completed_at)")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (
    membershipError &&
    (isSchemaMissingError(membershipError) || isNetworkFetchError(membershipError))
  ) {
    redirect(setupRedirectPath(membershipError));
  }

  const incomplete = memberships?.find((m) => {
    const org = m.organizations as unknown as { onboarding_completed_at?: string | null };
    return !org?.onboarding_completed_at;
  });
  if (incomplete && !params.error) {
    const { data: progress } = await supabase
      .from("organization_onboarding_progress")
      .select("current_step, completed_steps")
      .eq("organization_id", incomplete.organization_id)
      .maybeSingle();
    if (progress?.current_step && progress.current_step !== "welcome") {
      redirect(resumeOnboardingPath(progress, incomplete.organization_id));
    }
    if (params.org) {
      // continue welcome/company form path
    } else if (progress) {
      redirect(`/onboarding/industry?org=${incomplete.organization_id}`);
    }
  }

  const completed = memberships?.find((m) => {
    const org = m.organizations as unknown as { onboarding_completed_at?: string | null };
    return org?.onboarding_completed_at;
  });
  if (completed && !incomplete) redirect("/app/home");

  const errorText = params.error ? formatSupabaseUserError(params.error) : null;
  const showSetupLink =
    errorText &&
    (isSchemaMissingError(errorText) ||
      isNetworkFetchError(errorText) ||
      errorText.includes("/setup"));

  return (
    <OnboardingShell
      step="Onboarding · Welcome & company"
      title="Welcome to EHS360"
      description="Set up your organization once. We will create isolated tenant context for sites, projects, and users."
      currentStep="company"
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
          <Label htmlFor="name">Company name</Label>
          <Input id="name" name="name" required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="legalName">Legal name</Label>
          <Input id="legalName" name="legalName" />
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
          <Label htmlFor="companySize">Company size</Label>
          <Select id="companySize" name="companySize" defaultValue="">
            <option value="">Select</option>
            {COMPANY_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
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
          <Input id="country" name="country" placeholder="India" />
        </div>
        <Button type="submit" className="w-full">
          Continue
        </Button>
      </form>
    </OnboardingShell>
  );
}
