import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/app/actions/auth";

export default async function FieldLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Field
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-2 text-base text-muted-foreground">
          Report incidents, complete assigned actions, and keep permits current — one-handed.
        </p>
        <div className="mt-8 [&_button]:min-h-14 [&_button]:text-base [&_input]:min-h-14 [&_input]:text-base">
          <AuthForm
            mode="login"
            action={signInAction}
            next={params.next}
            portal="field"
            submitLabel="Continue"
          />
        </div>
      </div>
    </div>
  );
}
