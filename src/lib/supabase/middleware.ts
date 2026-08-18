import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSupabaseConfig } from "@/lib/env";

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

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const requestId = requestIdFrom(request);
  let supabaseResponse = NextResponse.next({ request });
  supabaseResponse.headers.set("x-ehs-pathname", pathname);
  supabaseResponse.headers.set("x-request-id", requestId);
  supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");

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
      pathname.startsWith("/onboarding") ||
      pathname.startsWith("/field") ||
      pathname.startsWith("/contractor")) &&
    !isAuthRoute;

  // Anonymous visitors on public/marketing routes: skip Supabase network call.
  if (!hasSupabaseAuthCookie(request) && !isProtected && !isAuthRoute) {
    supabaseResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=120, stale-while-revalidate=600",
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    anonKey,
    {
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
          supabaseResponse = NextResponse.next({ request });
          supabaseResponse.headers.set("x-ehs-pathname", pathname);
          supabaseResponse.headers.set("x-request-id", requestId);
          supabaseResponse.headers.set("X-Content-Type-Options", "nosniff");
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
    },
  );

  try {
    // Refresh session / validate JWT only when needed for auth gating or cookie refresh.
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user && isProtected) {
      const url = request.nextUrl.clone();
      url.pathname = pathname.startsWith("/admin")
        ? "/admin/login"
        : pathname.startsWith("/field")
          ? "/field/login"
          : pathname.startsWith("/contractor")
            ? "/contractor/login"
            : "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user && isAuthRoute) {
      const url = request.nextUrl.clone();
      if (pathname === "/admin/login") url.pathname = "/admin/tenants";
      else if (pathname === "/field/login") url.pathname = "/field/home";
      else if (pathname === "/contractor/login") url.pathname = "/contractor";
      else url.pathname = "/app/dashboard";
      return NextResponse.redirect(url);
    }

    // Admin gate only on /admin console — login is a public rewrite target.
    if (user && pathname.startsWith("/admin") && pathname !== "/admin/login") {
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_platform_admin")
        .eq("id", user.id)
        .maybeSingle();

      if (
        profileError &&
        (profileError.code === "PGRST205" ||
          profileError.message?.includes("schema cache") ||
          profileError.message?.includes("Could not find the table"))
      ) {
        const url = request.nextUrl.clone();
        url.pathname = "/setup";
        url.searchParams.set("reason", "schema");
        return NextResponse.redirect(url);
      }

      if (!profile?.is_platform_admin) {
        const url = request.nextUrl.clone();
        url.pathname = "/app/dashboard";
        return NextResponse.redirect(url);
      }
    }

    supabaseResponse.headers.set("Cache-Control", "private, no-store");
    supabaseResponse.headers.set("Vary", "Cookie");
    return supabaseResponse;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isFetch =
      message.toLowerCase().includes("fetch failed") ||
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
