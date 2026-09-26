"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { usePet } from "@/contexts/pet-context";
import { previewCareReminders } from "@/lib/native/care-reminder-data";
import {
  dispatchCareRemindersRefresh,
  formatReminderWhen,
  type CareReminder,
} from "@/lib/native/care-reminders";
import {
  getNotificationPermission,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "@/lib/native/local-notifications";
import { isNativeRuntime } from "@/lib/native/platform";
import { createClient } from "@/lib/supabase/client";
import type { NotificationPreferences } from "@/types/database";

export function DeviceRemindersSettings({ prefs }: { prefs: NotificationPreferences }) {
  const { pets } = usePet();
  const [permission, setPermission] = useState<NotificationPermissionState>("prompt");
  const [reminders, setReminders] = useState<CareReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const native = isNativeRuntime();

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const nextReminders = await previewCareReminders(supabase, pets, prefs);
      setReminders(nextReminders.slice(0, 8));
    } catch {
      setReminders([]);
    } finally {
      setLoading(false);
    }
  }, [pets, prefs]);

  const loadPermission = useCallback(async () => {
    if (!native) {
      setPermission("unavailable");
      return;
    }
    setPermission(await getNotificationPermission());
  }, [native]);

  useEffect(() => {
    void loadSchedule();
  }, [loadSchedule]);

  useEffect(() => {
    void loadPermission();
  }, [loadPermission]);

  useEffect(() => {
    if (!native) return;
    let remove: (() => void) | undefined;
    void import("@capacitor/app").then(async ({ App }) => {
      const handle = await App.addListener("appStateChange", ({ isActive }) => {
        if (!isActive) return;
        void (async () => {
          const next = await getNotificationPermission();
          setPermission(next);
          if (next === "granted") dispatchCareRemindersRefresh();
        })();
      });
      remove = () => {
        void handle.remove();
      };
    });
    return () => remove?.();
  }, [native]);

  async function enableReminders() {
    setAsking(true);
    try {
      const next = await requestNotificationPermission();
      setPermission(next);
      if (next === "granted") {
        dispatchCareRemindersRefresh();
        toast.success("Device reminders are on. We'll ping you at meal and check-in times.");
        return;
      }
      if (next === "denied") {
        toast.error("Notifications are blocked. Enable them in Android Settings → Apps → Animivo.");
        return;
      }
      if (next === "prompt") {
        toast.message("Turn on Notifications for Animivo, then return here.");
      }
    } finally {
      setAsking(false);
    }
  }

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Device reminders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Lock-screen reminders for feed times, weight check-ins, medications, and vaccines so you
          can jump back into Animivo.
        </p>
        {native ? (
          <PermissionRow permission={permission} asking={asking} onEnable={enableReminders} />
        ) : (
          <p className="text-sm text-muted-foreground">
            These appear on your phone after you install the Android app. The schedule below is
            what we will send.
          </p>
        )}
        <div className="space-y-2">
          <p className="text-sm font-medium">Upcoming</p>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading your care schedule…</p>
          ) : reminders.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reminders yet. Add a pet, meal time, or care task to start the schedule.
            </p>
          ) : (
            <ul className="space-y-2">
              {reminders.map((reminder) => (
                <li
                  key={reminder.key}
                  className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2"
                >
                  <p className="text-sm font-medium">{reminder.title}</p>
                  <p className="text-xs text-muted-foreground">{formatReminderWhen(reminder)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function PermissionRow({
  permission,
  asking,
  onEnable,
}: {
  permission: NotificationPermissionState;
  asking: boolean;
  onEnable: () => void;
}) {
  if (permission === "granted") {
    return <p className="text-sm text-muted-foreground">Phone notifications are on for this device.</p>;
  }
  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        {permission === "denied"
          ? "Android is blocking notifications for Animivo."
          : permission === "unavailable"
            ? "This phone still has an older Animivo install. Lock-screen reminders need a rebuilt APK (npx cap sync android, then Run on the phone). After that, tap Try again."
            : "Allow lock-screen reminders. On a Pixel emulator the system sheet often never appears, so Enable opens Animivo’s notification settings instead."}
      </p>
      <Button onClick={onEnable} disabled={asking} className="rounded-xl sm:w-auto">
        {asking ? "Waiting for Android…" : permission === "prompt" ? "Enable reminders" : "Try again"}
      </Button>
    </div>
  );
}
