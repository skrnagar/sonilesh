import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/app/actions/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  return (
    <AuthShell title="Sign in" subtitle="Access your SONIL EHS360 workspace.">
      {params.error === "supabase_not_configured" ? (
        <p className="mb-4 text-sm text-destructive">
          Configure Supabase environment variables before signing in.
        </p>
      ) : null}
      {params.reset ? (
        <p className="mb-4 text-sm text-success">Password updated. Sign in with your new password.</p>
      ) : null}
      <AuthForm mode="login" action={signInAction} next={params.next} portal="company" />
    </AuthShell>
  );
}
