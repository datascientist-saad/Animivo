import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = join(process.cwd(), "src");
const NATIVE_ROOTS = ["android", "ios", "native-www"].map((dir) => join(process.cwd(), dir));
const ALLOW_OPENAI = new Set(["src/services/ai-service.ts"]);
const ALLOW_SERVICE_ROLE = new Set(["src/lib/supabase/admin.ts"]);
const NATIVE_SKIP_DIRS = new Set(["build", ".gradle", "Pods", "DerivedData"]);

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) return walk(full);
    if (!/\.(ts|tsx|js|mjs)$/.test(entry)) return [];
    if (/\.test\.(ts|tsx)$/.test(entry)) return [];
    return [full];
  });
}

function walkNative(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (NATIVE_SKIP_DIRS.has(entry)) return [];
    if (stat.isDirectory()) return walkNative(full);
    if (!/\.(ts|tsx|js|mjs|java|kt|swift|xml|plist|json|html|gradle|properties)$/.test(entry)) return [];
    return [full];
  });
}

describe("mobile security: privileged secrets stay server-side", () => {
  const files = walk(ROOT);

  it("does not reference OPENAI_API_KEY outside the AI server service", () => {
    for (const file of files) {
      const rel = relative(process.cwd(), file);
      const text = readFileSync(file, "utf8");
      if (!text.includes("OPENAI_API_KEY")) continue;
      expect(ALLOW_OPENAI.has(rel)).toBe(true);
    }
  });

  it("does not reference SUPABASE_SERVICE_ROLE_KEY outside admin/server routes", () => {
    for (const file of files) {
      const rel = relative(process.cwd(), file);
      const text = readFileSync(file, "utf8");
      if (!text.includes("SUPABASE_SERVICE_ROLE_KEY")) continue;
      expect(ALLOW_SERVICE_ROLE.has(rel)).toBe(true);
    }
  });

  it("does not place server secrets in native projects or bundled assets", () => {
    for (const root of NATIVE_ROOTS) {
      for (const file of walkNative(root)) {
        const text = readFileSync(file, "utf8");
        expect(text.includes("OPENAI_API_KEY")).toBe(false);
        expect(text.includes("SUPABASE_SERVICE_ROLE_KEY")).toBe(false);
      }
    }
  });
});
