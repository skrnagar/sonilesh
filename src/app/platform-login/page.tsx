import { AuthForm } from "@/components/auth/auth-form";
import { signInAction } from "@/app/actions/auth";

export default async function PlatformLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#07111a] px-4 py-10 text-zinc-100">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1b26] p-8 shadow-2xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300/80">
          Platform Admin
        </p>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">SONIL EHS360 operations</h1>
        <p className="mt-2 text-sm text-zinc-400">
          Restricted console for SONIL operators. Company users should sign in at the workspace
          login.
        </p>
        <div className="mt-6 [&_a]:text-zinc-400 [&_label]:text-zinc-300 [&_p]:text-zinc-400">
          <AuthForm
            mode="login"
            action={signInAction}
            next={params.next}
            portal="admin"
            submitLabel="Enter console"
          />
        </div>
      </div>
    </div>
  );
}
