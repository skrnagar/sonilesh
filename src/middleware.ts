import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    // Protected app surfaces — session refresh + auth gating only where needed.
    "/app/:path*",
    "/admin/:path*",
    "/field/:path*",
    "/contractor/:path*",
    "/onboarding/:path*",
    // Auth flows (OAuth callback must refresh cookies).
    "/login",
    "/login/:path*",
    "/signup/:path*",
    "/forgot-password/:path*",
    "/reset-password/:path*",
    "/verify-email/:path*",
    "/auth/:path*",
    "/invite/:path*",
    "/setup",
  ],
};
