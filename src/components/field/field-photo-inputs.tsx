"use client";

import { useState } from "react";
import { fieldControlClass } from "@/components/field/field-ui";

/**
 * Mobile: `capture` forces the camera and hides the gallery on many browsers.
 * Offer both Take photo (with capture) and Attach from device (no capture).
 */
export function FieldPhotoInputs({
  accept = "image/*",
  className = fieldControlClass,
}: {
  accept?: string;
  className?: string;
}) {
  const [photoName, setPhotoName] = useState<string | null>(null);

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setPhotoName(file?.name ?? null);
    const form = e.currentTarget.form;
    if (!form) return;
    const other =
      e.currentTarget.name === "media_camera"
        ? form.querySelector<HTMLInputElement>('input[name="media_gallery"]')
        : form.querySelector<HTMLInputElement>('input[name="media_camera"]');
    if (other) other.value = "";
  }

  return (
    <div className="space-y-3">
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Take photo
        </span>
        <input
          type="file"
          name="media_camera"
          accept={accept}
          capture="environment"
          onChange={onPick}
          className={className}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Attach from device
        </span>
        <input
          type="file"
          name="media_gallery"
          accept={accept}
          onChange={onPick}
          className={className}
        />
        <span className="text-xs text-muted-foreground">
          {photoName ? photoName : "Gallery / files — optional. Does not open the camera."}
        </span>
      </label>
    </div>
  );
}
