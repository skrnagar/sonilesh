"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  fieldControlClass,
  fieldPrimaryBtnClass,
  FieldCard,
  FieldError,
} from "@/components/field/field-ui";
import { cn } from "@/lib/utils";

export type FieldQuestion = {
  id: string;
  prompt: string;
  questionType: string;
  isRequired: boolean;
  autoCapa: boolean;
};

export function InspectionRunner({
  assignmentId,
  title,
  questions,
  action,
}: {
  assignmentId: string;
  title: string;
  questions: FieldQuestion[];
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string }>;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("assignmentId", assignmentId);
    formData.set("answers", JSON.stringify(answers));
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error || "Could not save inspection");
      return;
    }
    router.refresh();
  }

  return (
    <form action={onSubmit} className="space-y-3">
      <FieldCard>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">Pass / Fail / NA. Photo and comment optional.</p>
      </FieldCard>
      {questions.map((q) => (
        <FieldCard key={q.id} className="space-y-3">
          <p className="text-sm font-medium text-foreground">{q.prompt}</p>
          <div className="grid grid-cols-3 gap-2">
            {["pass", "fail", "na"].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: value }))}
                className={cn(
                  "min-h-14 rounded-2xl border text-sm font-semibold uppercase tracking-wide",
                  answers[q.id] === value
                    ? value === "fail"
                      ? "border-destructive bg-[var(--danger-soft)] text-[var(--danger-ink)]"
                      : value === "pass"
                        ? "border-[var(--success)] bg-[var(--success-soft)] text-[var(--success-ink)]"
                        : "border-border bg-muted text-foreground"
                    : "border-border bg-background text-muted-foreground",
                )}
              >
                {value === "na" ? "N/A" : value}
              </button>
            ))}
          </div>
          <textarea
            name={`comment_${q.id}`}
            rows={2}
            placeholder="Comment"
            className={fieldControlClass}
          />
        </FieldCard>
      ))}
      <FieldCard className="space-y-3">
        <input type="file" name="media" accept="image/*" capture="environment" className={fieldControlClass} />
        <input name="signature" placeholder="Signature name" className={fieldControlClass} />
      </FieldCard>
      {error ? <FieldError text={error} /> : null}
      <button type="submit" disabled={pending} className={fieldPrimaryBtnClass}>
        {pending ? "Saving…" : "Submit inspection"}
      </button>
    </form>
  );
}
