import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";

export async function requireOnboardingOrg(orgId: string) {
  const { supabase, user } = await requireUser();
  if (!orgId) redirect("/onboarding");
  const { data: membership } = await supabase
    .from("organization_members")
    .select("id, organizations:organization_id(id, name, onboarding_completed_at)")
    .eq("organization_id", orgId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();
  if (!membership) redirect("/onboarding");
  const org = membership.organizations as unknown as {
    id: string;
    name: string;
    onboarding_completed_at: string | null;
  };
  if (org.onboarding_completed_at) redirect("/app/dashboard");
  return { supabase, user, organization: org };
}
