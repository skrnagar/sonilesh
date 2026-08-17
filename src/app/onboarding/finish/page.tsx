import { redirect } from "next/navigation";
import { requireOnboardingOrg } from "@/lib/onboarding/guard";

export default async function OnboardingFinishPage({
  searchParams,
}: {
  searchParams: Promise<{ org?: string }>;
}) {
  const params = await searchParams;
  // Finish is normally handled by review action; keep route for resume path.
  await requireOnboardingOrg(params.org ?? "");
  redirect(`/onboarding/review?org=${params.org}`);
}
