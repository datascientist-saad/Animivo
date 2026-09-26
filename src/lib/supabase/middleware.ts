import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { sanitizeNextPath } from "@/lib/auth-redirect";
import { isAuthPath, isPrivateAppPath, isPublicPath } from "@/lib/public-routes";
import { supabasePublicDefaults } from "@/lib/supabase/public-config";

/** Keep refreshed auth cookies on redirects so clicking Home does not sign the user out. */
export function redirectWithSessionCookies(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
  mutateUrl?: (url: URL) => void
) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = pathname;
  mutateUrl?.(redirectUrl);
  const redirectResponse = NextResponse.redirect(redirectUrl);
  sessionResponse.cookies.getAll().forEach((cookie) => {
    redirectResponse.cookies.set(cookie);
  });
  return redirectResponse;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || supabasePublicDefaults.url;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || supabasePublicDefaults.anonKey;

  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  if (user && pathname === "/") {
    return redirectWithSessionCookies(request, supabaseResponse, "/home");
  }

  if (!user && isPrivateAppPath(pathname)) {
    return redirectWithSessionCookies(request, supabaseResponse, "/login", (url) => {
      url.searchParams.set("next", pathname);
    });
  }

  if (user && isAuthPath(pathname) && pathname !== "/reset-password") {
    const requested = request.nextUrl.searchParams.get("next");
    const next = sanitizeNextPath(requested);
    const destination =
      requested === "/setup/complete" || next.startsWith("/invite/") || next === "/setup/complete"
        ? requested === "/setup/complete"
          ? "/setup/complete"
          : next
        : "/home";
    return redirectWithSessionCookies(request, supabaseResponse, destination, (url) => {
      url.searchParams.delete("next");
    });
  }

  if (!user && !isPublicPath(pathname) && !isAuthPath(pathname) && !pathname.startsWith("/api")) {
    // Public marketing assets and generated metadata stay reachable.
  }

  return supabaseResponse;
}
