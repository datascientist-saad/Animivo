/**
 * Canonical public site URL. Prefer NEXT_PUBLIC_APP_URL.
 * Current hosted production is animivo.vercel.app. A future custom domain
 * can be introduced later through a separate migration.
 * Never treat unique Vercel preview hostnames as the production canonical.
 * Never treat the unowned animivo.app hostname as production — Vercel
 * aliasing that host 307s the native WebView into a blank page.
 */
import { NATIVE_PRODUCTION_ORIGIN } from "@/lib/native/constants";

const PRODUCTION_FALLBACK = NATIVE_PRODUCTION_ORIGIN;
const KNOWN_PRODUCTION_HOSTS = new Set(["animivo.vercel.app"]);
const BLOCKED_PRODUCTION_HOSTS = new Set(["animivo.app", "www.animivo.app"]);

function originIfAllowed(raw: string | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
    if (BLOCKED_PRODUCTION_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getSiteUrl(): string {
  const configured = originIfAllowed(process.env.NEXT_PUBLIC_APP_URL);
  if (configured) return configured;

  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelEnv === "production" && vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "").toLowerCase();
    if (KNOWN_PRODUCTION_HOSTS.has(host) && !BLOCKED_PRODUCTION_HOSTS.has(host)) {
      return `https://${host}`;
    }
  }

  return PRODUCTION_FALLBACK;
}

export function absoluteUrl(path = "/"): string {
  const origin = getSiteUrl();
  if (!path || path === "/") return origin;
  return `${origin}${path.startsWith("/") ? path : `/${path}`}`;
}
