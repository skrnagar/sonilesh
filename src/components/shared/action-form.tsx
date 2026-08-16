"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ActionResult } from "@/app/actions/events";

export function ActionForm({
  action,
  children,
  className,
}: {
  action: (formData: FormData) => Promise<ActionResult>;
  children: React.ReactNode;
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.name) {
      formData.set(submitter.name, submitter.value);
    }
    setPending(true);
    setError(null);
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.href) {
      router.push(result.href);
    }
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className={className}>
      <fieldset disabled={pending} className="contents">
        {children}
      </fieldset>
      {error ? (
        <p className="rounded-md border border-[var(--danger-soft)] bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger-ink)]">
          {error}
        </p>
      ) : null}
    </form>
  );
}
