import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_NAME: z.string().default("SONIL EHS360"),
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
});

export function hasSupabaseConfig() {
  return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export function usesNewSupabaseApiKeys() {
  const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return key.startsWith("sb_publishable_") || key.startsWith("sb_secret_");
}
