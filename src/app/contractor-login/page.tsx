import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/app/actions/auth";

export default async function ContractorLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-dvh flex-col bg-background px-5 py-10">
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Contractor portal
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Assigned projects and document upload only — not the EHS admin workspace.
        </p>
        <div className="mt-8">
          <AuthForm
            mode="login"
            action={signInAction}
            next={params.next}
            portal="contractor"
            submitLabel="Continue"
          />
        </div>
      </div>
    </div>
  );
}
