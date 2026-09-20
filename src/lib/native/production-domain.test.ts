import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";
import { NATIVE_APP_ID, NATIVE_PRODUCTION_ORIGIN, NATIVE_URL_SCHEME } from "@/lib/native/constants";
import { getSiteUrl } from "@/lib/site";

const FORBIDDEN_HOSTED_ORIGIN = `https://${"animivo"}.app`;
const TEXT_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".xml",
  ".plist",
  ".html",
  ".example",
  ".webmanifest",
  ".gradle",
  ".properties",
  ".entitlements",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  "coverage",
  "android/.gradle",
  "android/app/build",
  "ios/App/Pods",
]);

function shouldSkip(rel: string): boolean {
  return SKIP_DIRS.has(rel) || rel.startsWith("node_modules/") || rel.startsWith(".next/");
}

function walk(dir: string, root = process.cwd()): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const rel = relative(root, full);
    if (shouldSkip(rel)) return [];
    const stat = statSync(full);
    if (stat.isDirectory()) return walk(full, root);
    const ext = entry.includes(".") ? `.${entry.split(".").pop()}` : "";
    if (!TEXT_EXTENSIONS.has(ext) && entry !== "capacitor.config.ts") return [];
    if (/\.test\.(ts|tsx)$/.test(entry)) return [];
    return [full];
  });
}

describe("hosted production origin", () => {
  it("uses the Vercel deployment, not the unowned animivo.app hostname", () => {
    expect(NATIVE_PRODUCTION_ORIGIN).toBe("https://animivo.vercel.app");
    expect(NATIVE_APP_ID).toBe("ai.animivo.app");
    expect(NATIVE_URL_SCHEME).toBe("animivo");
  });

  it("falls back to the hosted Vercel origin when NEXT_PUBLIC_APP_URL is unset", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    delete process.env.NEXT_PUBLIC_APP_URL;
    try {
      expect(getSiteUrl()).toBe("https://animivo.vercel.app");
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });

  it("ignores NEXT_PUBLIC_APP_URL when it points at the unowned apex hostname", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = FORBIDDEN_HOSTED_ORIGIN;
    try {
      expect(getSiteUrl()).toBe("https://animivo.vercel.app");
    } finally {
      if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
      else process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });

  it("does not hardcode https://animivo.app in active code or production documentation", () => {
    const hits: string[] = [];
    for (const file of walk(process.cwd())) {
      const text = readFileSync(file, "utf8");
      if (text.includes(FORBIDDEN_HOSTED_ORIGIN)) {
        hits.push(relative(process.cwd(), file));
      }
    }
    expect(hits).toEqual([]);
  });

  it("keeps the Android/iOS application id distinct from the hosted web origin", () => {
    expect(NATIVE_APP_ID).not.toBe("animivo.app");
    expect(`https://${NATIVE_APP_ID}`).not.toBe(NATIVE_PRODUCTION_ORIGIN);
  });

  it("keeps the custom URL scheme and application id intact", () => {
    expect(`${NATIVE_URL_SCHEME}://auth/callback`).toBe("animivo://auth/callback");
    expect(`${NATIVE_URL_SCHEME}://reset-password`).toBe("animivo://reset-password");
    expect(NATIVE_APP_ID).toBe("ai.animivo.app");
  });
});
