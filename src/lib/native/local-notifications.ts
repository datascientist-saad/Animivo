import { sanitizeNextPath } from "@/lib/auth-redirect";
import type { CareReminder } from "@/lib/native/care-reminders";
import { getCareRemindersNativePlugin, sleep } from "@/lib/native/care-reminders-plugin";

export const CARE_NOTIFICATION_CHANNEL_ID = "animivo-care";
export const LOCAL_NOTIFICATIONS_PLUGIN = "LocalNotifications";
const ASKED_STORAGE_KEY = "animivo-notify-asked";
const CHECK_TIMEOUT_MS = 2500;
const REQUEST_TIMEOUT_MS = 6000;
const GRANT_POLL_MS = 6000;

export type NotificationPermissionState = "granted" | "denied" | "prompt" | "unavailable";

export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(fallback), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      () => {
        clearTimeout(timer);
        resolve(fallback);
      }
    );
  });
}

async function getPlugin() {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;
  if (typeof Capacitor.isPluginAvailable === "function" && !Capacitor.isPluginAvailable(LOCAL_NOTIFICATIONS_PLUGIN)) {
    return null;
  }
  const { LocalNotifications } = await import("@capacitor/local-notifications");
  return LocalNotifications;
}

function asPermissionState(
  value: string | undefined,
  fallback: NotificationPermissionState
): NotificationPermissionState {
  return value === "granted" || value === "denied" || value === "prompt" ? value : fallback;
}

export async function getNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    const native = await getCareRemindersNativePlugin();
    if (native) {
      const access = await withTimeout(native.getNotificationAccess(), CHECK_TIMEOUT_MS, { enabled: false });
      return access.enabled ? "granted" : "prompt";
    }
    const plugin = await getPlugin();
    if (!plugin) return "unavailable";
    const status = await withTimeout(plugin.checkPermissions(), CHECK_TIMEOUT_MS, { display: "unavailable" });
    return asPermissionState(status.display, "unavailable");
  } catch {
    return "unavailable";
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  try {
    rememberPermissionPrompt();
    const native = await getCareRemindersNativePlugin();
    if (native) {
      await withTimeout(native.requestNotificationAccess(), CHECK_TIMEOUT_MS, { enabled: false });
      const granted = await waitForNotificationGrant(async () => {
        const access = await withTimeout(native.getNotificationAccess(), CHECK_TIMEOUT_MS, { enabled: false });
        return access.enabled;
      });
      if (granted) return "granted";
      await withTimeout(native.openNotificationSettings(), CHECK_TIMEOUT_MS, undefined);
      const afterSettings = await withTimeout(native.getNotificationAccess(), CHECK_TIMEOUT_MS, { enabled: false });
      return afterSettings.enabled ? "granted" : "prompt";
    }

    const plugin = await getPlugin();
    if (!plugin) return "unavailable";
    const status = await withTimeout(
      plugin.requestPermissions(),
      REQUEST_TIMEOUT_MS,
      { display: "unavailable" }
    );
    return asPermissionState(status.display, "unavailable");
  } catch {
    return "unavailable";
  }
}

async function waitForNotificationGrant(check: () => Promise<boolean>): Promise<boolean> {
  const deadline = Date.now() + GRANT_POLL_MS;
  while (Date.now() < deadline) {
    if (await check()) return true;
    await sleep(400);
  }
  return false;
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
  await withTimeout(
    plugin.createChannel({
      id: CARE_NOTIFICATION_CHANNEL_ID,
      name: "Care reminders",
      description: "Meal times, weight checks, and other care reminders",
      importance: 4,
      visibility: 1,
      vibration: true,
      lights: true,
      lightColor: "#6b8f71",
    }),
    CHECK_TIMEOUT_MS,
    undefined
  );
}

export async function cancelAllCareReminders() {
  const plugin = await getPlugin();
  if (!plugin) return;
  if (typeof plugin.cancelAll === "function") {
    await withTimeout(plugin.cancelAll(), CHECK_TIMEOUT_MS, undefined);
    return;
  }
  const pending = await withTimeout(plugin.getPending(), CHECK_TIMEOUT_MS, { notifications: [] });
  if (!pending.notifications.length) return;
  await withTimeout(
    plugin.cancel({
      notifications: pending.notifications.map((item) => ({ id: item.id })),
    }),
    CHECK_TIMEOUT_MS,
    undefined
  );
}

export async function scheduleCareReminders(reminders: CareReminder[]) {
  const plugin = await getPlugin();
  if (!plugin) return;
  await ensureCareNotificationChannel();
  await cancelAllCareReminders();
  if (!reminders.length) return;

  await withTimeout(
    plugin.schedule({
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
    }),
    8000,
    undefined
  );
}

export async function listenForCareReminderTaps(navigate: (path: string) => void): Promise<() => void> {
  const plugin = await getPlugin();
  if (!plugin) return () => undefined;
  const handle = await withTimeout(
    plugin.addListener("localNotificationActionPerformed", (event) => {
      const path = sanitizeNextPath(
        typeof event.notification.extra?.path === "string" ? event.notification.extra.path : null
      );
      navigate(path);
    }),
    CHECK_TIMEOUT_MS,
    null
  );
  if (!handle) return () => undefined;
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
