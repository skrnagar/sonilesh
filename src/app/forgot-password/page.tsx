import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { forgotPasswordAction } from "@/app/actions/auth";

export default function ForgotPasswordPage() {
  return (
    <AuthShell title="Forgot password" subtitle="We will email a secure reset link.">
      <AuthForm mode="forgot" action={forgotPasswordAction} />
    </AuthShell>
  );
}
