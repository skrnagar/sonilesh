import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { OnboardingShell } from "@/components/onboarding/onboarding-shell";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { acceptOrganizationInvitation } from "@/lib/services/invitations";
import { formatSupabaseUserError, isNextRedirect } from "@/lib/supabase/errors";
import { ORG_COOKIE, WORKSPACE_COOKIE_OPTIONS } from "@/lib/auth/workspace-cookies";

async function acceptInviteAction(formData: FormData) {
  "use server";
  const token = String(formData.get("token") || "");
  if (!token) redirect("/invite/accept?error=Missing%20token");
  const { supabase, user } = await requireUser();
  try {
    const result = await acceptOrganizationInvitation(supabase, {
      token,
      userId: user.id,
      email: user.email ?? "",
    });
    const jar = await cookies();
    jar.set(ORG_COOKIE, result.organizationId, WORKSPACE_COOKIE_OPTIONS);
    redirect("/app/home");
  } catch (err) {
    if (isNextRedirect(err)) throw err;
    redirect(
      `/invite/accept?token=${encodeURIComponent(token)}&error=${encodeURIComponent(formatSupabaseUserError(err))}`,
    );
  }
}

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user } = await requireUser();

  return (
    <OnboardingShell
      step="Invitation"
      title="Join organization"
      description="Confirm this invitation for your signed-in account, then complete your profile in settings if needed."
    >
      {params.error ? (
        <p className="mb-4 text-sm text-destructive">
          {formatSupabaseUserError(params.error)}
        </p>
      ) : null}
      {!params.token ? (
        <p className="text-sm text-muted-foreground">Invitation token is missing.</p>
      ) : (
        <form action={acceptInviteAction} className="space-y-4">
          <input type="hidden" name="token" value={params.token} />
          <p className="text-sm text-muted-foreground">
            Signed in as <strong>{user.email}</strong>
          </p>
          <Button type="submit" className="w-full">
            Accept invitation
          </Button>
        </form>
      )}
    </OnboardingShell>
  );
}
