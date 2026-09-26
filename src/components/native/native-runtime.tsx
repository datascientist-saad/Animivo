"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { OfflineBanner } from "@/components/native/offline-banner";
import { resolvePostAuthPath, sanitizeNextPath } from "@/lib/auth-redirect";
import { parseNativeDeepLink } from "@/lib/native/deep-links";
import { listenForCareReminderTaps } from "@/lib/native/local-notifications";
import { dismissTopOverlay, shouldExitOnBack } from "@/lib/native/navigation";
import { applyNativeSystemBars } from "@/lib/native/system-bars";
import { hasPendingOnboardingDraft } from "@/lib/onboarding-draft";
import { createClient } from "@/lib/supabase/client";

async function handleLaunchUrl(raw: string, navigate: (path: string) => void) {
  const parsed = parseNativeDeepLink(raw);
  if (parsed.kind === "invite") {
    navigate(`/invite/${parsed.token}`);
    return;
  }
  if (parsed.kind === "app-path") {
    navigate(parsed.path);
    return;
  }
  if (parsed.kind !== "auth-callback") return;

  if (parsed.error) {
    toast.error("Sign-in didn’t finish. Please try again.");
    navigate("/login?error=auth_callback_failed");
    return;
  }

  const supabase = createClient();
  try {
    try {
      const { Browser } = await import("@capacitor/browser");
      await Browser.close();
    } catch {
      // Browser may already be closed.
    }
    if (parsed.code) {
      const { error } = await supabase.auth.exchangeCodeForSession(parsed.code);
      if (error) throw error;
    } else if (parsed.accessToken && parsed.refreshToken) {
      const { error } = await supabase.auth.setSession({
        access_token: parsed.accessToken,
        refresh_token: parsed.refreshToken,
      });
      if (error) throw error;
    } else {
      navigate(`/login?error=auth_callback_failed`);
      return;
    }
    navigate(
      resolvePostAuthPath(sanitizeNextPath(parsed.next), {
        hasNoPets: false,
        hasIncompleteOnboarding: false,
        hasPendingOnboardingDraft: hasPendingOnboardingDraft(),
      })
    );
  } catch {
    toast.error("Could not complete sign-in. Please try again.");
    navigate("/login?error=auth_callback_failed");
  }
}

export function NativeRuntime() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    void (async () => {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || cancelled) return;

      document.documentElement.classList.add("native-app");
      document.documentElement.dataset.nativePlatform = Capacitor.getPlatform();

      await applyNativeSystemBars(document.documentElement.classList.contains("dark"));

      try {
        const { SplashScreen } = await import("@capacitor/splash-screen");
        await SplashScreen.hide();
      } catch {
        // Splash may already be hidden.
      }

      try {
        const { Keyboard } = await import("@capacitor/keyboard");
        const show = await Keyboard.addListener("keyboardWillShow", () => {
          document.documentElement.classList.add("keyboard-open");
        });
        const hide = await Keyboard.addListener("keyboardWillHide", () => {
          document.documentElement.classList.remove("keyboard-open");
        });
        cleanups.push(() => {
          void show.remove();
          void hide.remove();
        });
      } catch {
        // Keyboard plugin unavailable on web.
      }

      const { App } = await import("@capacitor/app");

      const back = await App.addListener("backButton", ({ canGoBack }) => {
        if (document.documentElement.classList.contains("keyboard-open")) {
          void import("@capacitor/keyboard").then(({ Keyboard }) => Keyboard.hide());
          return;
        }
        if (dismissTopOverlay()) return;
        if (shouldExitOnBack(window.location.pathname)) {
          void App.exitApp();
          return;
        }
        if (canGoBack) {
          window.history.back();
          return;
        }
        void App.exitApp();
      });
      cleanups.push(() => void back.remove());

      const opened = await App.addListener("appUrlOpen", ({ url }) => {
        void handleLaunchUrl(url, (path) => router.replace(path));
      });
      cleanups.push(() => void opened.remove());

      const launch = await App.getLaunchUrl();
      if (launch?.url) {
        void handleLaunchUrl(launch.url, (path) => router.replace(path));
      }

      const stopTaps = await listenForCareReminderTaps((path) => router.push(path));
      cleanups.push(stopTaps);
    })();

    return () => {
      cancelled = true;
      document.documentElement.classList.remove("keyboard-open");
      cleanups.forEach((fn) => fn());
    };
  }, [router]);

  return <OfflineBanner />;
}
