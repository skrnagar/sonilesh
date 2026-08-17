import { redirect } from "next/navigation";

/** Legacy plan step — review now includes plan selection. */
export default async function OnboardingPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const params = await searchParams;
  redirect(`/onboarding/review?org=${params.org ?? ""}`);
}
