import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { sanitizeRedirectUrl } from "@/utils/security";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const { pathname } = request.nextUrl;
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some((c) => c.name.includes("-auth-token"));

  // Fast path: If unauthenticated and trying to hit dashboard, redirect instantly
  if (pathname.startsWith("/dashboard") && !hasAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Fast path: If no auth cookie on login/signup/public pages, return immediately
  if (!hasAuthCookie) {
    return supabaseResponse;
  }

  // If auth cookie exists, securely verify user with a timeout safeguard
  let user = null;
  try {
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 2000)
    );
    const result = await Promise.race([supabase.auth.getUser(), timeoutPromise]);
    user = result?.data?.user || null;
  } catch {
    user = null;
  }

  // Protect /dashboard routes from unauthenticated access
  if (pathname.startsWith("/dashboard")) {
    if (!user && !hasAuthCookie) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      const redirectResponse = NextResponse.redirect(url);
      supabaseResponse.cookies.getAll().forEach((c) => {
        redirectResponse.cookies.set(c.name, c.value, c);
      });
      return redirectResponse;
    }
  }

  // If already authenticated and accessing login or signup, redirect to dashboard or redirectTo
  if (user && (pathname === "/login" || pathname === "/signup")) {
    const rawRedirect = request.nextUrl.searchParams.get("redirectTo");
    const safeTarget = sanitizeRedirectUrl(rawRedirect, "/dashboard");
    const url = new URL(safeTarget, request.url);
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((c) => {
      redirectResponse.cookies.set(c.name, c.value, c);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
