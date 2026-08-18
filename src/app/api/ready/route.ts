import { createAdminClient } from "@/lib/supabase/admin";
import { assertRequiredServerEnv, hasSupabaseConfig } from "@/lib/env";
import { jsonError, jsonOk } from "@/lib/http/api-response";

/**
 * Readiness: required server config is present and Postgres answers a cheap query.
 * Does not return key values, connection strings, or schema dumps.
 */
export async function GET(request: Request) {
  const envCheck = assertRequiredServerEnv({ strict: false });
  if (!envCheck.ok || !hasSupabaseConfig()) {
    return jsonError(
      "NOT_CONFIGURED",
      "Required application configuration is missing.",
      503,
      request,
    );
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.from("organizations").select("id").limit(1);
    if (error) {
      return jsonError("INTERNAL", "Database is not ready.", 503, request);
    }
  } catch {
    return jsonError("INTERNAL", "Database is not ready.", 503, request);
  }

  return jsonOk({ status: "ready" }, request);
}
