import { describe, expect, it } from "vitest";
import { parseNativeDeepLink, nativeAuthCallbackUrl } from "@/lib/native/deep-links";
import { isNativeRootPath, shouldExitOnBack } from "@/lib/native/navigation";
import { canExecutePurchase, getUpgradeCta, providerForPlatform } from "@/lib/billing/provider";
import { isNetworkError } from "@/lib/native/network";

describe("native deep links", () => {
  it("parses the custom-scheme auth callback", () => {
    const parsed = parseNativeDeepLink("animivo://auth/callback?code=abc&next=/home");
    expect(parsed).toMatchObject({ kind: "auth-callback", code: "abc", next: "/home" });
  });

  it("parses https auth callbacks", () => {
    const parsed = parseNativeDeepLink("https://animivo.app/auth/callback?code=xyz&next=/reset-password");
    expect(parsed).toMatchObject({ kind: "auth-callback", code: "xyz", next: "/reset-password" });
  });

  it("parses caregiver invite links", () => {
    const parsed = parseNativeDeepLink("animivo://invite/token-1");
    expect(parsed).toEqual({ kind: "invite", token: "token-1" });
  });

  it("builds the native callback URL", () => {
    expect(nativeAuthCallbackUrl("/home")).toBe("animivo://auth/callback?next=%2Fhome");
  });
});

describe("android back button roots", () => {
  it("exits from tab roots instead of returning to auth", () => {
    expect(isNativeRootPath("/home")).toBe(true);
    expect(shouldExitOnBack("/home")).toBe(true);
    expect(isNativeRootPath("/health")).toBe(true);
    expect(isNativeRootPath("/health/weight")).toBe(false);
    expect(shouldExitOnBack("/care")).toBe(false);
  });
});

describe("billing abstraction", () => {
  it("never executes purchases until a store adapter is connected", () => {
    expect(canExecutePurchase("web")).toBe(false);
    expect(canExecutePurchase("ios")).toBe(false);
    expect(canExecutePurchase("android")).toBe(false);
    expect(providerForPlatform("ios")).toBe("app_store");
    expect(providerForPlatform("android")).toBe("play_billing");
    expect(getUpgradeCta("ios").disabled).toBe(true);
    expect(getUpgradeCta("web").label).toMatch(/billing/i);
  });
});

describe("network errors", () => {
  it("detects fetch failures without exposing raw browser text to callers", () => {
    expect(isNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isNetworkError(new Error("validation failed"))).toBe(false);
  });
});
