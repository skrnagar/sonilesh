import Link from "next/link";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { acceptContractorInvite } from "@/lib/services/contractors";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import { ORG_COOKIE, WORKSPACE_COOKIE_OPTIONS } from "@/lib/auth/workspace-cookies";

async function acceptContractorInviteAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") || "");
  if (!token) redirect("/contractor/invite/accept?error=Missing%20token");
  const { supabase, user } = await requireUser();
  try {
    const result = await acceptContractorInvite(supabase, {
      token,
      userId: user.id,
      email: user.email ?? "",
    });
    const jar = await cookies();
    jar.set(ORG_COOKIE, result.organizationId, WORKSPACE_COOKIE_OPTIONS);
    redirect("/contractor");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    redirect(
      `/contractor/invite/accept?token=${encodeURIComponent(token)}&error=${encodeURIComponent(formatSupabaseUserError(err))}`,
    );
  }
}

export default async function ContractorInviteAcceptPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireUser();

  return (
    <OnboardingShell
      step="Contractor invite"
      title="Join contractor portal"
      description="Accept this invitation with your signed-in account. You will only see your company."
    >
      {params.error ? (
        <p className="mb-4 text-sm text-destructive">{formatSupabaseUserError(params.error)}</p>
      ) : null}
      {!params.token ? (
        <p className="text-sm text-muted-foreground">Invitation token is missing.</p>
      ) : (
        <form action={acceptContractorInviteAction} className="space-y-4">
          <input type="hidden" name="token" value={params.token} />
          <p className="text-sm text-muted-foreground">
            Signed in as <strong>{user.email}</strong>
          </p>
          <Button type="submit" className="w-full">
            Accept invitation
          </Button>
        </form>
      )}
      <p className="mt-4 text-xs text-muted-foreground">
        Wrong account? <Link href="/contractor/login" className="underline">Sign in again</Link>
      </p>
    </OnboardingShell>
  );
}
