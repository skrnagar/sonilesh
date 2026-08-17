import { finishOnboardingAction } from "@/app/actions/onboarding";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";
import { OnboardingError } from "@/components/onboarding/onboarding-error";

export default async function OnboardingReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, organization } = await requireOnboardingOrg(params.org ?? "");

  const [
    { count: sites },
    { count: projects },
    { count: bus },
    { data: plans },
    { data: progress },
  ] = await Promise.all([
    supabase
      .from("sites")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("deleted_at", null),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("deleted_at", null),
    supabase
      .from("business_units")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .is("deleted_at", null),
    supabase
      .from("plans")
      .select("id, name, code")
      .eq("is_public", true)
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("organization_onboarding_progress")
      .select("completed_steps, skipped_steps")
      .eq("organization_id", organization.id)
      .maybeSingle(),
  ]);

  return (
    <OnboardingShell
      step="Step 10 · Review"
      title="Review and finish"
      description="Confirm your setup. You can complete optional items anytime from Org admin."
      organizationId={organization.id}
      currentStep="review"
    >
      <OnboardingError error={params.error} />
      <div className="mb-6 space-y-2 text-sm">
        <p>
          <strong>{organization.name}</strong>
        </p>
        <p>Business units: {bus ?? 0}</p>
        <p>Sites: {sites ?? 0}</p>
        <p>Projects: {projects ?? 0}</p>
        <p>
          Completed steps: {(progress?.completed_steps ?? []).join(", ") || "—"}
        </p>
        <p>Skipped: {(progress?.skipped_steps ?? []).join(", ") || "—"}</p>
      </div>
      <form action={finishOnboardingAction} className="space-y-4">
        <input type="hidden" name="organizationId" value={organization.id} />
        <div className="space-y-2">
          <p className="text-sm font-medium">Select plan (optional)</p>
          {(plans ?? []).map((plan) => (
            <label key={plan.id} className="flex items-center gap-2 text-sm">
              <input type="radio" name="planId" value={plan.id} />
              {plan.name}
            </label>
          ))}
        </div>
        <Button type="submit" className="w-full">
          Finish setup
        </Button>
      </form>
    </OnboardingShell>
  );
}
