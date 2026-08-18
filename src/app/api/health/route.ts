import { jsonOk } from "@/lib/http/api-response";

/**
 * Liveness only. Does not probe the database or echo configuration.
 */
export async function GET(request: Request) {
  return jsonOk(
    {
      status: "ok",
      service: "ehs360",
    },
    request,
  );
}
