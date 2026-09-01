export const HEX_COLOR = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/;
export const SAFE_LABEL = /^[A-Za-z0-9][A-Za-z0-9 ./_-]{0,40}$/;
export const CURRENCY_CODE = /^[A-Z]{3}$/;
export const LOCALE_CODE = /^[a-z]{2}(-[A-Z]{2})?$/;
export const TIMEZONE_SAFE = /^[A-Za-z0-9_+\-/]{1,64}$/;

const TERMINOLOGY_KEYS = [
  "capaLabel",
  "incidentLabel",
  "permitLabel",
  "hazardLabel",
  "siteLabel",
] as const;

export type TerminologyMap = Partial<Record<(typeof TERMINOLOGY_KEYS)[number], string>>;

export function sanitizeHexColor(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (!HEX_COLOR.test(raw)) return null;
  return raw.toLowerCase();
}

export function sanitizeLabel(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  if (!SAFE_LABEL.test(raw)) return null;
  return raw;
}

export function sanitizeLogoUrl(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (raw.includes("<") || raw.includes(">") || raw.includes("javascript:")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function sanitizeBranding(input: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  logoUrl?: string | null;
  terminology?: Record<string, string | null | undefined> | null;
}) {
  const terminology: TerminologyMap = {};
  for (const key of TERMINOLOGY_KEYS) {
    const safe = sanitizeLabel(input.terminology?.[key] ?? null);
    if (safe) terminology[key] = safe;
  }
  return {
    primaryColor: sanitizeHexColor(input.primaryColor),
    secondaryColor: sanitizeHexColor(input.secondaryColor),
    logoUrl: sanitizeLogoUrl(input.logoUrl),
    terminology,
  };
}

export function brandingCssVars(branding: {
  primaryColor?: string | null;
  secondaryColor?: string | null;
}) {
  const vars: Record<string, string> = {};
  const primary = sanitizeHexColor(branding.primaryColor);
  const secondary = sanitizeHexColor(branding.secondaryColor);
  if (primary) {
    vars["--tenant-primary"] = primary;
    vars["--primary"] = primary;
  }
  if (secondary) {
    vars["--tenant-secondary"] = secondary;
  }
  return vars;
}

export function sanitizeCurrency(value: string | null | undefined) {
  const raw = (value ?? "").trim().toUpperCase();
  return CURRENCY_CODE.test(raw) ? raw : null;
}

export function sanitizeLocale(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  return LOCALE_CODE.test(raw) ? raw : null;
}

export function sanitizeTimezone(value: string | null | undefined) {
  const raw = (value ?? "").trim();
  return TIMEZONE_SAFE.test(raw) ? raw : null;
}

const CUSTOM_DOMAIN =
  /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$/;

export function sanitizeCustomDomain(value: string | null | undefined) {
  const raw = (value ?? "").trim().toLowerCase();
  if (!raw) return null;
  if (!CUSTOM_DOMAIN.test(raw)) return null;
  return raw;
}
