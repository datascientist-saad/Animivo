import { NATIVE_PRODUCTION_ORIGIN, NATIVE_URL_SCHEME } from "@/lib/native/constants";
import { sanitizeNextPath } from "@/lib/auth-redirect";

export type NativeDeepLink =
  | { kind: "auth-callback"; code?: string; next: string; accessToken?: string; refreshToken?: string; error?: string }
  | { kind: "invite"; token: string }
  | { kind: "app-path"; path: string }
  | { kind: "unknown"; url: string };

function toUrl(raw: string): URL | null {
  try {
    if (raw.startsWith(`${NATIVE_URL_SCHEME}://`)) {
      return new URL(raw.replace(`${NATIVE_URL_SCHEME}://`, `${NATIVE_PRODUCTION_ORIGIN}/`));
    }
    return new URL(raw);
  } catch {
    return null;
  }
}

export function parseNativeDeepLink(raw: string): NativeDeepLink {
  const url = toUrl(raw);
  if (!url) return { kind: "unknown", url: raw };

  const path = url.pathname.replace(/\/+$/, "") || "/";
  const hashParams = new URLSearchParams(url.hash.replace(/^#/, ""));
  const code = url.searchParams.get("code") ?? hashParams.get("code") ?? undefined;
  const accessToken = hashParams.get("access_token") ?? url.searchParams.get("access_token") ?? undefined;
  const refreshToken = hashParams.get("refresh_token") ?? url.searchParams.get("refresh_token") ?? undefined;
  const error = url.searchParams.get("error") ?? hashParams.get("error") ?? undefined;

  if (path === "/auth/callback" || path.endsWith("/auth/callback")) {
    return {
      kind: "auth-callback",
      code,
      next: sanitizeNextPath(url.searchParams.get("next")),
      accessToken,
      refreshToken,
      error: error ?? undefined,
    };
  }

  const inviteMatch = path.match(/^\/invite\/([^/]+)$/);
  if (inviteMatch?.[1]) {
    return { kind: "invite", token: inviteMatch[1] };
  }

  if (path.startsWith("/") && !path.startsWith("//")) {
    return { kind: "app-path", path: `${path}${url.search}` };
  }

  return { kind: "unknown", url: raw };
}

export function nativeAuthCallbackUrl(nextPath: string): string {
  const next = sanitizeNextPath(nextPath);
  return `${NATIVE_URL_SCHEME}://auth/callback?next=${encodeURIComponent(next)}`;
}

export function httpsAuthCallbackUrl(origin: string, nextPath: string): string {
  const next = sanitizeNextPath(nextPath);
  return `${origin.replace(/\/$/, "")}/auth/callback?next=${encodeURIComponent(next)}`;
}
