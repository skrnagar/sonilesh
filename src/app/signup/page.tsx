import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { signUpAction } from "@/app/actions/auth";

export default function SignupPage() {
  return (
    <AuthShell
      title="Create your account"
      subtitle="Then create an organization and invite your EHS team."
    >
      <AuthForm mode="signup" action={signUpAction} />
    </AuthShell>
  );
}
