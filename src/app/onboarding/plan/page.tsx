import { selectPlanAction } from "@/app/actions/onboarding";
import { requireUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";

export default async function OnboardingPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const { org } = await searchParams;
  const { supabase } = await requireUser();
  const { data: plans } = await supabase
    .from("plans")
    .select("id, code, name, description, price_monthly_cents, is_public")
    .eq("is_active", true)
    .eq("is_public", true)
    .order("sort_order");

  return (
    <OnboardingShell
      step="Onboarding · Step 4"
      title="Select a plan"
      description="Billing is not charged yet. Plan selection drives feature entitlements from the database."
    >
      <div className="grid gap-3">
        {(plans ?? []).map((plan) => (
          <form
            key={plan.id}
            action={selectPlanAction}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background/70 p-4 transition-colors hover:border-accent/40"
          >
            <input type="hidden" name="organizationId" value={org || ""} />
            <input type="hidden" name="planId" value={plan.id} />
            <div>
              <p className="font-semibold text-foreground">{plan.name}</p>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {(plan.price_monthly_cents / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                })}
                /month
              </p>
            </div>
            <Button type="submit">Select</Button>
          </form>
        ))}
      </div>
    </OnboardingShell>
  );
}
