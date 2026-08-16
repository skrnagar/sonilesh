"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  fieldControlClass,
  fieldPrimaryBtnClass,
  FieldCard,
  FieldError,
} from "@/components/field/field-ui";

type Result = { ok: boolean; error?: string };

export function FieldSubmitForm({
  action,
  children,
  submitLabel,
  className,
}: {
  action: (formData: FormData) => Promise<Result>;
  children: React.ReactNode;
  submitLabel: string;
  className?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error || "Request failed");
      return;
    }
    router.refresh();
  }

  return (
    <form action={onSubmit} className={className ?? "space-y-2"}>
      {children}
      {error ? <FieldError text={error} /> : null}
      <button type="submit" disabled={pending} className={fieldPrimaryBtnClass}>
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}

export function CapaCompleteCard({
  id,
  title,
  meta,
  action,
}: {
  id: string;
  title: string;
  meta: string;
  action: (formData: FormData) => Promise<Result>;
}) {
  return (
    <FieldCard>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{meta}</p>
      <FieldSubmitForm action={action} submitLabel="Complete with evidence" className="mt-3 space-y-2">
        <input type="hidden" name="capaId" value={id} />
        <input type="file" name="media" accept="image/*" capture="environment" className={fieldControlClass} />
        <input name="evidence" placeholder="Evidence note" className={fieldControlClass} />
        <textarea name="comment" placeholder="Comment" rows={2} className={fieldControlClass} />
      </FieldSubmitForm>
    </FieldCard>
  );
}

export function ActionCompleteCard({
  id,
  title,
  meta,
  action,
}: {
  id: string;
  title: string;
  meta: string;
  action: (formData: FormData) => Promise<Result>;
}) {
  return (
    <FieldCard>
      <p className="font-medium text-foreground">{title}</p>
      <p className="mt-1 text-xs capitalize text-muted-foreground">{meta}</p>
      <FieldSubmitForm action={action} submitLabel="Mark complete" className="mt-3 space-y-2">
        <input type="hidden" name="actionId" value={id} />
        <input name="evidence" placeholder="Evidence note" className={fieldControlClass} />
      </FieldSubmitForm>
    </FieldCard>
  );
}
