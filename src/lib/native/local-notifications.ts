import { sanitizeNextPath } from "@/lib/auth-redirect";
import type { CareReminder } from "@/lib/native/care-reminders";

export const CARE_NOTIFICATION_CHANNEL_ID = "animivo-care";
const ASKED_STORAGE_KEY = "animivo-notify-asked";

export type NotificationPermissionState = "granted" | "denied" | "prompt" | "unavailable";

async function getPlugin() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

export async function getNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    const plugin = await getPlugin();
    if (!plugin) return "unavailable";
    const status = await plugin.checkPermissions();
    return status.display === "granted" || status.display === "denied" || status.display === "prompt"
      ? status.display
      : "prompt";
  } catch {
    return "unavailable";
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    const plugin = await getPlugin();
    if (!plugin) return "unavailable";
    rememberPermissionPrompt();
    const status = await plugin.requestPermissions();
    return status.display === "granted" || status.display === "denied" || status.display === "prompt"
      ? status.display
      : "denied";
  } catch {
    return "unavailable";
  }
}

export function hasAskedNotificationPermission(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(ASKED_STORAGE_KEY) === "1";
}

export function rememberPermissionPrompt() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ASKED_STORAGE_KEY, "1");
}

export async function ensureCareNotificationChannel() {
  const plugin = await getPlugin();
  if (!plugin) return;
  await plugin.createChannel({
    id: CARE_NOTIFICATION_CHANNEL_ID,
    name: "Care reminders",
    description: "Meal times, weight checks, and other care reminders",
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: "#6b8f71",
  });
}

export async function cancelAllCareReminders() {
  const plugin = await getPlugin();
  if (!plugin) return;
  if (typeof plugin.cancelAll === "function") {
    await plugin.cancelAll();
    return;
  }
  const pending = await plugin.getPending();
  if (!pending.notifications.length) return;
  await plugin.cancel({
    notifications: pending.notifications.map((item) => ({ id: item.id })),
  });
}

export async function scheduleCareReminders(reminders: CareReminder[]) {
  const plugin = await getPlugin();
  if (!plugin) return;
  await ensureCareNotificationChannel();
  await cancelAllCareReminders();
  if (!reminders.length) return;

  await plugin.schedule({
    notifications: reminders.map((reminder) => ({
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      largeBody: reminder.body,
      schedule: toNativeSchedule(reminder),
      extra: { path: reminder.path, kind: reminder.kind, petId: reminder.petId, key: reminder.key },
      channelId: CARE_NOTIFICATION_CHANNEL_ID,
      smallIcon: "ic_stat_animivo",
      iconColor: "#6b8f71",
      autoCancel: true,
      group: "animivo-care",
      isExactNotification: false,
    })),
  });
}

export async function listenForCareReminderTaps(navigate: (path: string) => void): Promise<() => void> {
  const plugin = await getPlugin();
  if (!plugin) return () => undefined;
  const handle = await plugin.addListener("localNotificationActionPerformed", (event) => {
    const path = sanitizeNextPath(
      typeof event.notification.extra?.path === "string" ? event.notification.extra.path : null
    );
    navigate(path);
  });
  return () => {
    void handle.remove();
  };
}

function toNativeSchedule(reminder: CareReminder) {
  const allowWhileIdle = true;
  if (reminder.repeat === "once" && reminder.at) {
    return { at: new Date(reminder.at), allowWhileIdle };
  }
  if (reminder.repeat === "weekly" && reminder.weekday) {
    return {
      on: { weekday: reminder.weekday, hour: reminder.hour, minute: reminder.minute },
      allowWhileIdle,
    };
  }
  if (reminder.repeat === "monthly" && reminder.dayOfMonth) {
    return {
      on: { day: reminder.dayOfMonth, hour: reminder.hour, minute: reminder.minute },
      allowWhileIdle,
    };
  }
  return {
    on: { hour: reminder.hour, minute: reminder.minute },
    allowWhileIdle,
  };
}
