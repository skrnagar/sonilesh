/**
 * Classify Supabase / network failures into actionable user guidance.
 */

export const SCHEMA_SETUP_MESSAGE =
  "Database schema is not applied on this Supabase project. Open /setup and apply supabase/_all_migrations.sql (or run node scripts/apply-migrations.mjs), then retry.";

export const NETWORK_SETUP_MESSAGE =
  "Could not reach Supabase (network/fetch failed). Check NEXT_PUBLIC_SUPABASE_URL, your connection, and project status. See /setup.";

type Errorish = {
  message?: string;
  code?: string;
  name?: string;
  cause?: unknown;
  digest?: string;
};

function asErrorish(err: unknown): Errorish {
  if (!err || typeof err !== "object") {
    return { message: typeof err === "string" ? err : String(err) };
  }
  return err as Errorish;
}

function collectText(err: unknown): string {
  const e = asErrorish(err);
  const parts = [e.message, e.code, e.name];
  if (e.cause) parts.push(collectText(e.cause));
  return parts.filter(Boolean).join(" ");
}

export function isNextRedirect(err: unknown): boolean {
  const e = asErrorish(err);
  return Boolean(e.digest?.startsWith("NEXT_REDIRECT"));
}

/** PostgREST missing table/function / schema cache miss */
export function isSchemaMissingError(err: unknown): boolean {
  const e = asErrorish(err);
  const text = collectText(err);
  return (
    e.code === "PGRST202" ||
    e.code === "PGRST205" ||
    text.includes("schema cache") ||
    text.includes("Could not find the table") ||
    text.includes("Could not find the function") ||
    text.includes("Database schema is not applied")
  );
}

/** undici / Node fetch failures often surface as TypeError: fetch failed */
export function isNetworkFetchError(err: unknown): boolean {
  const e = asErrorish(err);
  const text = collectText(err).toLowerCase();
  if (e.name === "TypeError" && text.includes("fetch failed")) return true;
  if (text.includes("fetch failed")) return true;
  if (text.includes("networkerror") || text.includes("econnrefused")) return true;
  if (text.includes("enotfound") || text.includes("etimedout")) return true;
  if (text.includes("could not reach supabase")) return true;
  return false;
}

export function formatSupabaseUserError(err: unknown): string {
  if (isSchemaMissingError(err)) return SCHEMA_SETUP_MESSAGE;
  if (isNetworkFetchError(err)) return NETWORK_SETUP_MESSAGE;
  const e = asErrorish(err);
  if (e.message && e.message.trim()) return e.message;
  if (typeof err === "string" && err.trim()) return err;
  return "Unexpected Supabase error. Check /setup for configuration and schema status.";
}

export function setupRedirectPath(err: unknown): string {
  const reason = isNetworkFetchError(err)
    ? "network"
    : isSchemaMissingError(err)
      ? "schema"
      : "supabase";
  return `/setup?reason=${reason}`;
}
