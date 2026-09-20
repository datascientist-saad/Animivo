/**
 * Canonical public site URL. Prefer NEXT_PUBLIC_APP_URL.
 * Current hosted production is animivo.vercel.app. A future custom domain
 * can be introduced later through a separate migration.
 * Never treat unique Vercel preview hostnames as the production canonical.
 */
import { NATIVE_PRODUCTION_ORIGIN } from "@/lib/native/constants";

const PRODUCTION_FALLBACK = NATIVE_PRODUCTION_ORIGIN;
const KNOWN_PRODUCTION_HOSTS = new Set(["animivo.vercel.app"]);

export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      return url.origin;
    } catch {
      // fall through
    }
  }

  const vercelEnv = process.env.VERCEL_ENV;
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelEnv === "production" && vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//, "");
    if (KNOWN_PRODUCTION_HOSTS.has(host)) {
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
