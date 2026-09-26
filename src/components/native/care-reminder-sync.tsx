"use client";

import { useEffect } from "react";
import { usePet } from "@/contexts/pet-context";
import { useUser } from "@/contexts/user-context";
import { syncDeviceCareReminders } from "@/lib/native/care-reminder-data";
import {
  CARE_REMINDERS_REFRESH_EVENT,
  DEFAULT_NOTIFICATION_PREFS,
} from "@/lib/native/care-reminders";
import {
  cancelAllCareReminders,
  getNotificationPermission,
  hasAskedNotificationPermission,
  requestNotificationPermission,
} from "@/lib/native/local-notifications";
import { isNativeRuntime } from "@/lib/native/platform";
import { createClient } from "@/lib/supabase/client";

export function CareReminderSync() {
  const { user, profile, loading: userLoading } = useUser();
  const { pets, loading: petsLoading } = usePet();

  useEffect(() => {
    if (userLoading || petsLoading) return;
    if (!isNativeRuntime()) return;

    let cancelled = false;
    const supabase = createClient();
    const prefs = profile?.notification_preferences ?? DEFAULT_NOTIFICATION_PREFS;

    async function sync() {
      if (!user) {
        await cancelAllCareReminders();
        return;
      }
      if (cancelled) return;

      const permission = await getNotificationPermission();
      if (permission !== "granted") {
        const anyEnabled =
          prefs.care_reminders ||
          prefs.vaccination_alerts ||
          prefs.medication_alerts ||
          prefs.weight_suggestions;
        if (permission === "prompt" && anyEnabled && !hasAskedNotificationPermission()) {
          const next = await requestNotificationPermission();
          if (next !== "granted" || cancelled) return;
        } else {
          return;
        }
      }

      await syncDeviceCareReminders(supabase, pets, prefs);
    }

    void sync();

    const onRefresh = () => {
      void sync();
    };
    window.addEventListener(CARE_REMINDERS_REFRESH_EVENT, onRefresh);

    let removeState: (() => void) | undefined;
    void import("@capacitor/app").then(async ({ App }) => {
      const handle = await App.addListener("appStateChange", ({ isActive }) => {
        if (isActive) void sync();
      });
      if (cancelled) {
        void handle.remove();
        return;
      }
      removeState = () => {
        void handle.remove();
      };
    });

    return () => {
      cancelled = true;
      window.removeEventListener(CARE_REMINDERS_REFRESH_EVENT, onRefresh);
      removeState?.();
    };
  }, [user, profile, pets, userLoading, petsLoading]);

  return null;
}
