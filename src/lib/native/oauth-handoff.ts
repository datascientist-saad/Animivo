import { NATIVE_URL_SCHEME } from "@/lib/native/constants";
import { sanitizeNextPath } from "@/lib/auth-redirect";

export const NATIVE_OAUTH_FLAG = "native";

export function httpsNativeCallbackUrl(origin: string, nextPath: string): string {
  const next = sanitizeNextPath(nextPath);
  const url = new URL("/auth/callback", origin.endsWith("/") ? origin : `${origin}/`);
  url.searchParams.set("next", next);
  url.searchParams.set(NATIVE_OAUTH_FLAG, "1");
  return url.toString();
}

export function shouldHandoffOAuthToNativeApp(searchParams: URLSearchParams): boolean {
  return searchParams.get(NATIVE_OAUTH_FLAG) === "1";
}

export function buildNativeOAuthHandoffUrl(searchParams: URLSearchParams): string {
  const target = new URL(`${NATIVE_URL_SCHEME}://auth/callback`);
  for (const key of ["code", "next", "error", "error_description", "state"]) {
    const value = searchParams.get(key);
    if (value) target.searchParams.set(key, value);
  }
  if (!target.searchParams.get("next")) {
    target.searchParams.set("next", sanitizeNextPath(null));
  }
  return target.toString();
}

export function nativeOAuthHandoffHtml(location: string): string {
  const safe = location.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${safe}" />
    <title>Opening Animivo</title>
  </head>
  <body>
    <p>Returning to Animivo…</p>
    <p><a href="${safe}">Open the Animivo app</a></p>
    <script>location.replace(${JSON.stringify(location)});</script>
  </body>
</html>`;
}
