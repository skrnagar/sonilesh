"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin } from "lucide-react";
import {
  fieldControlClass,
  fieldPrimaryBtnClass,
  fieldSecondaryBtnClass,
  FieldError,
} from "@/components/field/field-ui";
import { FIELD_LABELS } from "@/lib/field/labels";

type Mode = "incident" | "near-miss" | "lmra";

type Props = {
  mode: Mode;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string; id?: string }>;
};

export function QuickCaptureForm({ mode, action }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [coords, setCoords] = useState("");
  const [photoName, setPhotoName] = useState<string | null>(null);

  const copy =
    mode === "lmra"
      ? FIELD_LABELS.lmra
      : mode === "near-miss"
        ? FIELD_LABELS.nearMiss
        : FIELD_LABELS.incident;

  async function captureLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported on this device.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`);
        setError(null);
      },
      () => setError("Location permission denied. You can type a location instead."),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const submitter = (e.nativeEvent as SubmitEvent).submitter;
    if (submitter instanceof HTMLButtonElement && submitter.name) {
      formData.set(submitter.name, submitter.value);
    }
    setPending(true);
    setError(null);
    formData.set("gps", coords);
    formData.set("mode", mode === "lmra" ? "hazard" : mode);
    const result = await action(formData);
    setPending(false);
    if (!result.ok) {
      setError(result.error || "Submit failed");
      return;
    }
    router.push("/field");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Photo
        </span>
        <input
          type="file"
          name="media"
          accept="image/*,video/*"
          capture="environment"
          onChange={(e) => setPhotoName(e.target.files?.[0]?.name ?? null)}
          className={fieldControlClass}
        />
        {photoName ? (
          <span className="text-xs text-muted-foreground">{photoName}</span>
        ) : (
          <span className="text-xs text-muted-foreground">Optional. Use the camera when you can.</span>
        )}
      </label>

      <div className="space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Location
        </span>
        <div className="flex gap-2">
          <button type="button" onClick={captureLocation} className={`${fieldSecondaryBtnClass} max-w-[7.5rem] shrink-0`}>
            <MapPin className="mr-1.5 h-4 w-4" aria-hidden />
            GPS
          </button>
          <input
            name="location_text"
            value={coords}
            onChange={(e) => setCoords(e.target.value)}
            placeholder="Bay, unit, or GPS"
            className={fieldControlClass}
          />
        </div>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {mode === "lmra" ? "Risks and controls" : "What happened?"}
        </span>
        <textarea
          name="description"
          required
          rows={4}
          inputMode="text"
          className={fieldControlClass}
          placeholder={
            mode === "lmra"
              ? "Task risks and the controls you will use"
              : "Keep it short — voice-to-text friendly"
          }
        />
      </label>

      {mode === "lmra" ? (
        <>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Category
            </span>
            <select name="category" className={fieldControlClass}>
              <option value="unsafe_condition">Unsafe condition</option>
              <option value="unsafe_act">Unsafe act</option>
              <option value="hazard">LMRA / other</option>
            </select>
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Risk level
            </span>
            <select name="risk_level" className={fieldControlClass}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {mode === "lmra" ? "Immediate control" : "Immediate action"}
        </span>
        <textarea name="immediate_action" rows={2} className={fieldControlClass} />
      </label>

      {mode === "incident" ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            People involved
          </span>
          <input name="people" className={fieldControlClass} placeholder="Names or count" />
        </label>
      ) : null}

      <input type="hidden" name="occurred_at" value={new Date().toISOString()} />

      {error ? <FieldError text={error} /> : null}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className={fieldSecondaryBtnClass}
        >
          Save draft
        </button>
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
          className={fieldPrimaryBtnClass}
        >
          {pending ? "Saving…" : `Submit ${copy.short}`}
        </button>
      </div>
    </form>
  );
}

/** @deprecated Use QuickCaptureForm */
export const QuickReportForm = QuickCaptureForm;
