import { getNativePlatform } from "@/lib/native/platform";

export type BillingPlatform = "web" | "ios" | "android";

export type BillingProviderId = "none" | "web" | "app_store" | "play_billing";

export interface UpgradeCta {
  label: string;
  disabled: boolean;
  hint: string;
  provider: BillingProviderId;
}

export function getBillingPlatform(): BillingPlatform {
  return getNativePlatform();
}

/**
 * No live purchase execution until a real Apple/Google/web adapter is connected.
 * Native stores must not open a web checkout for digital upgrades.
 */
export function canExecutePurchase(_platform: BillingPlatform = getBillingPlatform()): boolean {
  return false;
}

export function getUpgradeCta(platform: BillingPlatform = getBillingPlatform()): UpgradeCta {
  if (platform === "ios") {
    return {
      label: "Apple In-App Purchase coming soon",
      disabled: true,
      hint: "Animivo Plus will use Apple In-App Purchase. Store checkout is disabled until that adapter is live.",
      provider: "app_store",
    };
  }
  if (platform === "android") {
    return {
      label: "Google Play Billing coming soon",
      disabled: true,
      hint: "Animivo Plus will use Google Play Billing. Store checkout is disabled until that adapter is live.",
      provider: "play_billing",
    };
  }
  return {
    label: "Connect billing to upgrade",
    disabled: true,
    hint: "Payments are not processed until a server-side web billing adapter is connected.",
    provider: "web",
  };
}

export function providerForPlatform(platform: BillingPlatform): BillingProviderId {
  if (platform === "ios") return "app_store";
  if (platform === "android") return "play_billing";
  return "web";
}
