import { registerPlugin } from "@capacitor/core";

export type CareRemindersNativePlugin = {
  getNotificationAccess(): Promise<{ enabled: boolean }>;
  requestNotificationAccess(): Promise<{ enabled: boolean }>;
  openNotificationSettings(): Promise<void>;
};

const CareRemindersNative = registerPlugin<CareRemindersNativePlugin>("CareReminders");

export async function getCareRemindersNativePlugin(): Promise<CareRemindersNativePlugin | null> {
  const { Capacitor } = await import("@capacitor/core");
  if (!Capacitor.isNativePlatform()) return null;
  if (typeof Capacitor.isPluginAvailable === "function" && !Capacitor.isPluginAvailable("CareReminders")) {
    return null;
  }
  return CareRemindersNative;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
