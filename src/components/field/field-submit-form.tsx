"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fieldControlClass,
  fieldPrimaryBtnClass,
  FieldCard,
  FieldError,
} from "@/components/field/field-ui";
import { FieldPhotoInputs } from "@/components/field/field-photo-inputs";
import {
  enqueueFieldUpdate,
  queueToFormData,
  readFieldQueue,
  removeFieldQueueItem,
} from "@/lib/field/offline-queue";
import { attachDirectUpload } from "@/lib/storage/direct-upload";

type Result = { ok: boolean; error?: string; href?: string };

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
  const [queued, setQueued] = useState(false);

  useEffect(() => {
    async function flush() {
      if (!navigator.onLine) return;
      const items = readFieldQueue();
      for (const item of items) {
        const result = await action(queueToFormData(item));
        if (result.ok) removeFieldQueueItem(item.id);
      }
      router.refresh();
    }
    window.addEventListener("online", flush);
    return () => window.removeEventListener("online", flush);
  }, [action, router]);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    setQueued(false);
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      const hasFile = [...formData.values()].some(
        (v) => v instanceof File && v.size > 0,
      );
      if (hasFile) {
        setError("Photos need a network connection. Stay online to attach evidence, then submit.");
        setPending(false);
        return;
      }
      enqueueFieldUpdate(submitLabel, formData);
      setQueued(true);
      setPending(false);
      return;
    }
    try {
      await attachDirectUpload(formData, "field/evidence");
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Upload failed");
      return;
    }
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error || "Request failed");
      return;
    }
    if (result.href) {
      router.push(result.href);
      return;
    }
    router.refresh();
  }

  return (
    <form action={onSubmit} className={className ?? "space-y-2"}>
      {children}
      {error ? <FieldError text={error} /> : null}
      {queued ? (
        <p className="text-xs font-medium text-[var(--warning-ink)]">Pending sync — will send when you are back online.</p>
      ) : null}
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
        <FieldPhotoInputs />
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
