import { formatSupabaseUserError } from "@/lib/supabase/errors";

export function OnboardingError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <div className="mb-4 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {formatSupabaseUserError(error)}
    </div>
  );
}
