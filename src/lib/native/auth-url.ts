import { httpsAuthCallbackUrl, nativeAuthCallbackUrl } from "@/lib/native/deep-links";
import { isNativeRuntime } from "@/lib/native/platform";
import { getSiteUrl } from "@/lib/site";

/**
 * Auth emails and OAuth must return into the running client.
 * Native builds use the custom scheme so the OS hands the code back to the WebView
 * (where the PKCE verifier lives). Web keeps first-party HTTPS callbacks.
 */
export function getAuthCallbackUrl(nextPath = "/home"): string {
  if (isNativeRuntime()) {
    return nativeAuthCallbackUrl(nextPath);
  }
  const origin = typeof window !== "undefined" ? window.location.origin : getSiteUrl();
  return httpsAuthCallbackUrl(origin, nextPath);
}
