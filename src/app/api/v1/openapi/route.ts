import { OPENAPI_DOCUMENT } from "@/lib/api/openapi";

export async function GET() {
  return Response.json(OPENAPI_DOCUMENT);
}
