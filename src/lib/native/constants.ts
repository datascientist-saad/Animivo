export const NATIVE_APP_ID = "ai.animivo.app";
export const NATIVE_APP_NAME = "Animivo";
export const NATIVE_URL_SCHEME = "animivo";
export const NATIVE_PRODUCTION_ORIGIN = "https://animivo.app";

export const NATIVE_TAB_ROOTS = [
  "/",
  "/home",
  "/health",
  "/health/diet",
  "/care-plan",
  "/login",
  "/signup",
  "/get-started",
] as const;

export const AUTH_HANDOFF_PATHS = ["/login", "/signup", "/onboarding", "/setup/complete", "/verify-email"] as const;
