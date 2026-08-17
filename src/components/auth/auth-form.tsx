"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormProps = {
  mode: "login" | "signup" | "forgot" | "reset";
  action: (formData: FormData) => Promise<{ error?: string; success?: string } | void>;
  next?: string;
  portal?: "admin" | "company" | "field";
  submitLabel?: string;
};

export function AuthForm({ mode, action, next, portal, submitLabel }: AuthFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-4"
      action={(formData) => {
        setError(null);
        setSuccess(null);
        startTransition(async () => {
          const result = await action(formData);
          if (result?.error) setError(result.error);
          if (result?.success) setSuccess(result.success);
        });
      }}
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {portal ? <input type="hidden" name="portal" value={portal} /> : null}

      {mode === "signup" ? (
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input id="fullName" name="fullName" required autoComplete="name" />
        </div>
      ) : null}

      {mode !== "reset" ? (
        <div className="space-y-2">
          <Label htmlFor="email">Work email</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
      ) : null}

      {mode === "login" || mode === "signup" || mode === "reset" ? (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            autoComplete={mode === "login" ? "current-password" : "new-password"}
          />
        </div>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-success">{success}</p> : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending
          ? "Please wait…"
          : mode === "login"
            ? submitLabel ?? "Sign in"
            : mode === "signup"
              ? "Create account"
              : mode === "forgot"
                ? "Send reset link"
                : "Update password"}
      </Button>

      <div className="flex justify-between text-xs text-muted-foreground">
        {mode === "login" ? (
          <>
            <Link href="/forgot-password">Forgot password</Link>
            <Link href="/signup">Create account</Link>
          </>
        ) : (
          <Link href="/login">Back to sign in</Link>
        )}
      </div>
    </form>
  );
}
