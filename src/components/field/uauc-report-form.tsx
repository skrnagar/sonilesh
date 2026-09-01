"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import {
  fieldControlClass,
  FieldError,
  fieldRakshaBtnClass,
} from "@/components/field/field-ui";
import { FieldPhotoInputs } from "@/components/field/field-photo-inputs";
import { attachDirectUpload } from "@/lib/storage/direct-upload";

type Option = { id: string; name: string };

type CategoryGroup = {
  eventTypeCode: string;
  categories: Option[];
};

type Props = {
  action: (formData: FormData) => Promise<{ ok: boolean; error?: string; id?: string }>;
  businessUnits: Option[];
  regions: Option[];
  projects: Option[];
  categoryGroups: CategoryGroup[];
  defaultBusinessUnitId?: string | null;
  defaultRegionId?: string | null;
  defaultProjectId?: string | null;
  defaultSiteId?: string | null;
};

export function UaucReportForm({
  action,
  businessUnits,
  regions,
  projects,
  categoryGroups,
  defaultBusinessUnitId,
  defaultRegionId,
  defaultProjectId,
  defaultSiteId,
}: Props) {
  const router = useRouter();
  const [eventKind, setEventKind] = useState<"ua" | "uc" | "wsn">("ua");
  const [categoryId, setCategoryId] = useState("");
  const [noAttachments, setNoAttachments] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const eventTypeCode =
    eventKind === "uc" ? "unsafe_condition" : eventKind === "wsn" ? "safety_observation" : "unsafe_act";

  const categories = useMemo(
    () => categoryGroups.find((g) => g.eventTypeCode === eventTypeCode)?.categories ?? [],
    [categoryGroups, eventTypeCode],
  );

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("mode", "uauc");
    formData.set("type", eventTypeCode);
    formData.set("intent", "submit");

    if (noAttachments) {
      formData.set("no_attachments", "true");
    }

    try {
      if (!noAttachments) {
        await attachDirectUpload(formData, "field/uauc");
      }
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
    router.push(result.id ? `/field/ua-uc/${result.id}` : "/field/ualist");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="flex justify-end">
        <Link
          href="/field/ualist"
          aria-label="Back to list"
          className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#6f42c1] text-white hover:bg-[#5a32a8]"
        >
          <LayoutGrid className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Business Unit</span>
          <select
            name="businessUnitId"
            defaultValue={defaultBusinessUnitId ?? ""}
            className={fieldControlClass}
          >
            <option value="">Select business unit</option>
            {businessUnits.map((bu) => (
              <option key={bu.id} value={bu.id}>
                {bu.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Region</span>
          <select name="regionId" defaultValue={defaultRegionId ?? ""} className={fieldControlClass}>
            <option value="">Select region</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Project</span>
          <select name="projectId" defaultValue={defaultProjectId ?? ""} className={fieldControlClass}>
            <option value="">Select project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <fieldset className="space-y-2">
          <legend className="text-xs font-semibold text-muted-foreground">UA or UC</legend>
          <div className="flex flex-wrap gap-4 pt-1">
            {(
              [
                ["ua", "UA"],
                ["uc", "UC"],
                ["wsn", "WSN"],
              ] as const
            ).map(([value, label]) => (
              <label key={value} className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="event_kind"
                  value={value}
                  checked={eventKind === value}
                  onChange={() => {
                    setEventKind(value);
                    setCategoryId("");
                  }}
                />
                {label}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Category</span>
          <select
            name="categoryId"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className={fieldControlClass}
          >
            <option value="">---Select Category---</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Subcategory</span>
          <input
            name="subcategory"
            placeholder="---Select Subcategory---"
            className={fieldControlClass}
          />
        </label>
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-semibold text-muted-foreground">Incident Description</span>
        <textarea
          name="description"
          required
          minLength={8}
          rows={4}
          placeholder="Description"
          className={fieldControlClass}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Incident Date Time</span>
          <input
            type="datetime-local"
            name="occurred_at"
            required
            defaultValue={new Date().toISOString().slice(0, 16)}
            className={fieldControlClass}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground">Location</span>
          <input name="location_text" placeholder="Location" className={fieldControlClass} />
        </label>
      </div>

      <input type="hidden" name="siteId" value={defaultSiteId ?? ""} />

      <label className="inline-flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={noAttachments}
          onChange={(e) => setNoAttachments(e.target.checked)}
        />
        No Attachments
      </label>

      {!noAttachments ? (
        <div className="space-y-2 rounded-[var(--radius-lg)] border border-dashed border-border p-4">
          <p className="text-sm font-semibold text-[var(--raksha-blue)]">Capture Image(s)</p>
          <FieldPhotoInputs accept="image/*" />
        </div>
      ) : null}

      {error ? <FieldError text={error} /> : null}

      <div className="flex justify-end">
        <button type="submit" disabled={pending} className={`${fieldRakshaBtnClass} min-w-[8rem]`}>
          {pending ? "Submitting…" : "Submit"}
        </button>
      </div>
    </form>
  );
}
