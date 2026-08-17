"use client";

type PermitQrCodeProps = {
  /** Auth-gated field path, e.g. /field/permits/PTW-2026-0001 */
  path: string;
  label?: string;
  size?: number;
};

/**
 * QR architecture stub — encodes an authenticated field deep-link.
 * Scanning must still require login + authorization; never public permit data.
 */
export function PermitQrCode({ path, label, size = 128 }: PermitQrCodeProps) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://app.local";
  const target = `${origin}${path.startsWith("/") ? path : `/${path}`}`;
  const src = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(target)}`;

  return (
    <figure className="inline-flex flex-col items-center gap-2 rounded-xl border border-border bg-muted/30 p-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} width={size} height={size} alt={label ? `QR for ${label}` : "Permit QR"} />
      <figcaption className="max-w-[10rem] text-center text-[10px] text-muted-foreground">
        {label ?? "Scan requires auth"}
      </figcaption>
    </figure>
  );
}
