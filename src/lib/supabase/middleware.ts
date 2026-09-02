import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/env";

const AUTH_TIMEOUT_MS = 5_000;

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      (cookie) =>
        cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"),
    );
}

function requestIdFrom(request: NextRequest) {
  const incoming = request.headers.get("x-request-id")?.trim();
  return incoming && incoming.length <= 128 ? incoming : crypto.randomUUID();
}

function loginPathFor(pathname: string) {
  if (pathname.startsWith("/admin")) return "/admin/login";
  if (pathname.startsWith("/field")) return "/field/login";
  if (pathname.startsWith("/contractor")) return "/contractor/login";
  if (pathname.startsWith("/org-admin")) return "/login";
  return "/login";
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const url = request.nextUrl.clone();
  url.pathname = loginPathFor(pathname);
  url.searchParams.set("next", pathname);
  return NextResponse.redirect(url);
}

function withSecurityHeaders(
  request: NextRequest,
  pathname: string,
  requestId: string,
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-ehs-pathname", pathname);
  requestHeaders.set("x-request-id", requestId);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set("x-request-id", requestId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  return response;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("auth timeout")), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestId = requestIdFrom(request);
  let supabaseResponse = withSecurityHeaders(request, pathname, requestId);

  if (!hasSupabaseConfig()) {
    return supabaseResponse;
  }

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!supabaseUrl || !anonKey) {
    return supabaseResponse;
  }

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname === "/admin/login" ||
    pathname === "/field/login" ||
    pathname === "/contractor/login" ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/verify-email");
  const isProtected =
    (pathname.startsWith("/app") ||
      pathname.startsWith("/admin") ||
      pathname.startsWith("/org-admin") ||
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/field") ||
      pathname.startsWith("/contractor")) &&
    !isAuthRoute;

  const hasAuthCookie = hasSupabaseAuthCookie(request);

  // No session cookie: gate protected routes locally; skip Supabase on public/auth pages.
  if (!hasAuthCookie) {
    if (isProtected) {
      return redirectToLogin(request, pathname);
    }
    supabaseResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=600",
    );
    return supabaseResponse;
  }

  // Cookie present but route is public (e.g. marketing) — defer refresh to app layouts.
  if (!isProtected && !isAuthRoute) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=600",
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(
        cookiesToSet: Array<{
          name: string;
          value: string;
          options?: Record<string, unknown>;
        }>,
      ) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = withSecurityHeaders(request, pathname, requestId);
        supabaseResponse.headers.set("Cache-Control", "private, no-store");
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, {
            ...options,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            path: "/",
          });
        });
      },
    },
  });

  try {
    const {
      data: { user },
    } = await withTimeout(supabase.auth.getUser(), AUTH_TIMEOUT_MS);

    if (!user && isProtected) {
      return redirectToLogin(request, pathname);
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      if (pathname === "/admin/login") url.pathname = "/admin/tenants";
      else if (pathname === "/field/login") url.pathname = "/field/home";
      else if (pathname === "/contractor/login") url.pathname = "/contractor";
      else url.pathname = "/app/home";
      return NextResponse.redirect(url);
    }

    // Admin authorization is enforced in admin layout (requirePlatformAdmin).
    supabaseResponse.headers.set("Cache-Control", "private, no-store");
    supabaseResponse.headers.set("Vary", "Cookie");
    return supabaseResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isFetch =
      message.toLowerCase().includes("fetch failed") ||
      message.toLowerCase().includes("auth timeout") ||
      (err instanceof TypeError && message.toLowerCase().includes("fetch"));
    if (isFetch && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = "/setup";
      url.searchParams.set("reason", "network");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }
}
