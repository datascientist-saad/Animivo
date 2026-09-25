import { httpsAuthCallbackUrl } from "@/lib/native/deep-links";
import { httpsNativeCallbackUrl } from "@/lib/native/oauth-handoff";
import { isNativeRuntime } from "@/lib/native/platform";
import { getSiteUrl } from "@/lib/site";

/**
 * Auth emails and OAuth must return into the running client.
 * Native builds use an HTTPS callback with native=1 so Google/Supabase accept
 * the redirect, then /auth/callback bounces to animivo:// without exchanging
 * the PKCE code. The WebView (where the verifier lives) completes the session.
 * Web keeps first-party HTTPS callbacks and exchanges the code on the server.
 */
export function getAuthCallbackUrl(nextPath = "/home"): string {
  const origin = typeof window !== "undefined" ? window.location.origin : getSiteUrl();
  if (isNativeRuntime()) {
    return httpsNativeCallbackUrl(origin, nextPath);
  }
  return httpsAuthCallbackUrl(origin, nextPath);
}
