"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  mode: "incident" | "near-miss" | "hazard";
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string; id?: string }>;
};

export function QuickReportForm({ mode, action }: Props) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [coords, setCoords] = useState<string>("");

  async function captureLocation() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords(`${pos.coords.latitude.toFixed(6)},${pos.coords.longitude.toFixed(6)}`);
      },
      () => setError("Location permission denied"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  async function onSubmit(formData: FormData) {
    setPending(true);
    setError(null);
    formData.set("gps", coords);
    formData.set("mode", mode);
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
    <form action={onSubmit} className="space-y-3">
      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-wide text-slate-400">Photo / video</span>
        <input
          type="file"
          name="media"
          accept="image/*,video/*"
          capture="environment"
          className="block w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-sm"
        />
      </label>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={captureLocation}
          className="flex-1 rounded-xl border border-white/15 px-3 py-3 text-sm font-semibold"
        >
          Use GPS
        </button>
        <input
          name="location_text"
          value={coords}
          onChange={(e) => setCoords(e.target.value)}
          placeholder="Location"
          className="flex-[2] rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-sm"
        />
      </div>

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {mode === "hazard" ? "Description" : "What happened?"}
        </span>
        <textarea
          name="description"
          required
          rows={4}
          inputMode="text"
          className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-base"
          placeholder="Keep it short — voice-to-text friendly"
        />
      </label>

      {mode === "hazard" ? (
        <>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Hazard category</span>
            <select name="category" className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-sm">
              <option value="unsafe_condition">Unsafe condition</option>
              <option value="unsafe_act">Unsafe act</option>
              <option value="hazard">Hazard</option>
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-xs uppercase tracking-wide text-slate-400">Risk level</span>
            <select name="risk_level" className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </label>
        </>
      ) : null}

      <label className="block space-y-1">
        <span className="text-xs uppercase tracking-wide text-slate-400">
          {mode === "hazard" ? "Immediate control" : "Immediate action"}
        </span>
        <textarea
          name="immediate_action"
          rows={2}
          className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-base"
        />
      </label>

      {mode === "incident" ? (
        <label className="block space-y-1">
          <span className="text-xs uppercase tracking-wide text-slate-400">People involved</span>
          <input
            name="people"
            className="w-full rounded-xl border border-white/15 bg-slate-900 px-3 py-3 text-sm"
            placeholder="Names or count"
          />
        </label>
      ) : null}

      <input type="hidden" name="occurred_at" value={new Date().toISOString()} />

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          type="submit"
          name="intent"
          value="draft"
          disabled={pending}
          className="rounded-xl border border-white/20 py-4 text-sm font-bold uppercase tracking-wide"
        >
          Draft
        </button>
        <button
          type="submit"
          name="intent"
          value="submit"
          disabled={pending}
          className="rounded-xl bg-teal-500 py-4 text-sm font-bold uppercase tracking-wide text-slate-950"
        >
          {pending ? "Saving…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
