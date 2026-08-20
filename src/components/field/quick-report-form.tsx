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
import { FieldPhotoInputs } from "@/components/field/field-photo-inputs";
import { FIELD_LABELS } from "@/lib/field/labels";
import { attachDirectUpload } from "@/lib/storage/direct-upload";

type Mode = "incident" | "near-miss" | "lmra" | "observation";

type Option = { id: string; name: string; code?: string };

type Props = {
  mode: Mode;
  /** When mode is observation, backend event type (unsafe_act, etc.). */
  eventTypeCode?: string;
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string; id?: string }>;
  sites?: Option[];
  severities?: Option[];
  categories?: Option[];
  defaultSiteId?: string;
};

export function QuickCaptureForm({
  mode,
  eventTypeCode,
  action,
  sites = [],
  severities = [],
  categories = [],
  defaultSiteId,
}: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [coords, setCoords] = useState("");

  const copy =
    mode === "lmra"
      ? FIELD_LABELS.lmra
      : mode === "near-miss"
        ? FIELD_LABELS.nearMiss
        : mode === "observation"
          ? {
              short:
                eventTypeCode === "unsafe_condition"
                  ? "Unsafe condition"
                  : eventTypeCode === "safety_observation"
                    ? "Observation"
                    : eventTypeCode === "hazard"
                      ? "Hazard"
                      : "Unsafe act",
              title: "New report",
              subtitle: "Photo, location, short description",
            }
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
      { enableHighAccuracy: false, timeout: 4000, maximumAge: 60000 },
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
    if (mode === "lmra") formData.set("mode", "hazard");
    else if (mode === "observation") formData.set("mode", eventTypeCode || "hazard");
    else formData.set("mode", mode);
    if (eventTypeCode) formData.set("type", eventTypeCode);
    try {
      await attachDirectUpload(formData, `field/${mode}`);
    } catch (err) {
      setPending(false);
      setError(err instanceof Error ? err.message : "Photo upload failed");
      return;
    }
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
      <FieldPhotoInputs accept="image/*" />

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

      {sites.length > 0 ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Site
          </span>
          <select
            name="siteId"
            required={mode === "incident" || mode === "near-miss"}
            defaultValue={defaultSiteId || ""}
            className={fieldControlClass}
          >
            <option value="">Select site</option>
            {sites.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {mode === "lmra" ? "Risks and controls" : "What happened?"}
        </span>
        <textarea
          name="description"
          required
          minLength={8}
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

      {mode === "incident" ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Classification
          </span>
          <select name="report_kind" defaultValue="incident" className={fieldControlClass}>
            <option value="incident">Incident</option>
            <option value="unsafe_act">Unsafe Act</option>
            <option value="unsafe_condition">Unsafe Condition</option>
          </select>
        </label>
      ) : null}

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

      {(mode === "incident" || mode === "near-miss") && categories.length > 0 ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Category
          </span>
          <select name="categoryId" defaultValue="" className={fieldControlClass}>
            <option value="">Optional</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}

      {(mode === "incident" || mode === "near-miss") && severities.length > 0 ? (
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Severity
          </span>
          <select
            name={mode === "near-miss" ? "potentialSeverityId" : "severityId"}
            required
            defaultValue=""
            className={fieldControlClass}
          >
            <option value="">Select severity</option>
            {severities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
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
