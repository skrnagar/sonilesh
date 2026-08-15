import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Verify your email"
      subtitle="Check your inbox for a verification link from Supabase Auth."
    >
      <p className="text-sm text-muted-foreground">
        After verification you can sign in and complete organization onboarding.
      </p>
      <Button asChild className="mt-6 w-full">
        <Link href="/login">Continue to sign in</Link>
      </Button>
    </AuthShell>
  );
}
