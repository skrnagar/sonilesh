"use client";

import { useTransition } from "react";
import { signOutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="w-full rounded-xl"
      disabled={pending}
      aria-busy={pending}
      onClick={() => {
        startTransition(async () => {
          await signOutAction();
        });
      }}
    >
      {pending ? "Signing out…" : "Sign out"}
    </Button>
  );
}
