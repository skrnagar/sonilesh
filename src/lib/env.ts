import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("SONIL EHS360"),
  DEPLOYMENT_MODE: z.enum(["cloud", "self_hosted"]).optional(),
});

/** Prefer NEXT_PUBLIC_*; fall back to official SUPABASE_URL. */
function resolveSupabaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    undefined
  );
}

/** Prefer legacy anon name; fall back to publishable aliases. */
function resolveAnonKey() {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    undefined
  );
}

/** Prefer SERVICE_ROLE; fall back to official SECRET. */
function resolveServiceRoleKey() {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    undefined
  );
}

function resolveJwksUrl() {
  const explicit = process.env.SUPABASE_JWKS_URL;
  if (explicit) return explicit;
  const base = resolveSupabaseUrl();
  return base ? `${base.replace(/\/$/, "")}/auth/v1/.well-known/jwks.json` : undefined;
}

export const env = envSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: resolveSupabaseUrl(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: resolveAnonKey(),
  SUPABASE_SERVICE_ROLE_KEY: resolveServiceRoleKey(),
  SUPABASE_JWKS_URL: resolveJwksUrl(),
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME ?? "SONIL EHS360",
  DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE === "self_hosted" ? "self_hosted" : "cloud",
});

export function hasSupabaseConfig() {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function isProductionRuntime() {
  return process.env.VERCEL_ENV === "production";
}

/**
 * Required for production: public Supabase URL + anon/publishable key + service role.
 * AI / billing provider secrets are optional and must not block local or preview boots.
 */
export function assertRequiredServerEnv(opts?: { strict?: boolean }) {
  const missing: string[] = [];
  if (!resolveSupabaseUrl()) missing.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!resolveAnonKey()) missing.push("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const requireServiceRole = opts?.strict ?? isProductionRuntime();
  if (requireServiceRole && !resolveServiceRoleKey()) {
    missing.push("SUPABASE_SERVICE_ROLE_KEY");
  }
  return { ok: missing.length === 0, missing };
}

export function isSelfHosted() {
  return env.DEPLOYMENT_MODE === "self_hosted" || process.env.DEPLOYMENT_MODE === "self_hosted";
}

export function billingGraceDays() {
  const raw = Number(process.env.BILLING_GRACE_DAYS ?? "3");
  return Number.isFinite(raw) && raw >= 0 ? raw : 3;
}

export function selfHostFeatureCodes(): string[] | null {
  const raw = process.env.SELF_HOST_FEATURE_CODES;
  if (!raw?.trim()) return null;
  return raw.split(",").map((code) => code.trim()).filter(Boolean);
}
