type CapacitorBridge = {
  isNativePlatform?: () => boolean;
  getPlatform?: () => string;
};

function getCapacitor(): CapacitorBridge | undefined {
  if (typeof window === "undefined") return undefined;
  return (window as unknown as { Capacitor?: CapacitorBridge }).Capacitor;
}

export function isNativeRuntime(): boolean {
  return getCapacitor()?.isNativePlatform?.() === true;
}

export function getNativePlatform(): "ios" | "android" | "web" {
  if (!isNativeRuntime()) return "web";
  const platform = getCapacitor()?.getPlatform?.();
  if (platform === "ios" || platform === "android") return platform;
  return "web";
}
