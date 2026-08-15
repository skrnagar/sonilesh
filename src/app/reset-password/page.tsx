import { AuthShell } from "@/components/auth/auth-shell";
import { AuthForm } from "@/components/auth/auth-form";
import { resetPasswordAction } from "@/app/actions/auth";

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Reset password" subtitle="Choose a new password for your account.">
      <AuthForm mode="reset" action={resetPasswordAction} />
    </AuthShell>
  );
}
