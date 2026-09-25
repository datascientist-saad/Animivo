import { describe, expect, it } from "vitest";
import { getAuthCallbackUrl } from "@/lib/native/auth-url";
import {
  buildNativeOAuthHandoffUrl,
  httpsNativeCallbackUrl,
  shouldHandoffOAuthToNativeApp,
} from "@/lib/native/oauth-handoff";

describe("native OAuth handoff", () => {
  it("builds an HTTPS callback that Google and Supabase can accept", () => {
    expect(httpsNativeCallbackUrl("https://animivo.vercel.app", "/setup/complete")).toBe(
      "https://animivo.vercel.app/auth/callback?next=%2Fsetup%2Fcomplete&native=1"
    );
  });

  it("does not hand off ordinary website callbacks", () => {
    expect(shouldHandoffOAuthToNativeApp(new URLSearchParams("code=abc&next=/home"))).toBe(false);
    expect(shouldHandoffOAuthToNativeApp(new URLSearchParams("code=abc&native=1"))).toBe(true);
  });

  it("bounces the unused PKCE code to the Capacitor custom scheme", () => {
    const location = buildNativeOAuthHandoffUrl(
      new URLSearchParams("code=pkce-code&next=/setup/complete&native=1")
    );
    expect(location).toBe("animivo://auth/callback?code=pkce-code&next=%2Fsetup%2Fcomplete");
  });

  it("keeps website getAuthCallbackUrl on HTTPS without the native flag", () => {
    expect(getAuthCallbackUrl("/home")).toBe("https://animivo.vercel.app/auth/callback?next=%2Fhome");
  });
});
