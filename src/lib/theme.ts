export const THEME_STORAGE_KEY = "animivo-theme";
export const THEME_COOKIE_NAME = "animivo-theme";
export const THEME_PREFERENCES = ["light", "dark", "system"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];
export const DEFAULT_THEME_PREFERENCE: ThemePreference = "light";

export const THEME_COLORS = {
  light: {
    background: "#faf7f2",
    foreground: "#2c2a26",
  },
  dark: {
    background: "#1c1a17",
    foreground: "#f4efe8",
  },
} as const;

export function parseThemePreference(value: unknown): ThemePreference | null {
  return THEME_PREFERENCES.includes(value as ThemePreference) ? (value as ThemePreference) : null;
}

export function resolveThemePreference(
  preference: ThemePreference,
  systemPrefersDark: boolean
): "light" | "dark" {
  if (preference === "system") return systemPrefersDark ? "dark" : "light";
  return preference;
}

export function persistThemePreference(preference: ThemePreference) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Private mode or storage blocked.
  }
  document.cookie = `${THEME_COOKIE_NAME}=${preference}; Path=/; Max-Age=31536000; SameSite=Lax`;
}

export function readStoredThemePreference(): ThemePreference | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = parseThemePreference(window.localStorage.getItem(THEME_STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // ignore
  }
  const match = document.cookie.match(/(?:^|; )animivo-theme=([^;]+)/);
  return parseThemePreference(match ? decodeURIComponent(match[1]) : null);
}

/** Runs before paint so the Android WebView does not flash the wrong theme. */
export const THEME_BOOTSTRAP_SCRIPT = `(function(){
  try {
    var key=${JSON.stringify(THEME_STORAGE_KEY)};
    var stored=null;
    try { stored=localStorage.getItem(key); } catch (e) {}
    if (!stored) {
      var match=document.cookie.match(/(?:^|; )animivo-theme=([^;]+)/);
      stored=match?decodeURIComponent(match[1]):null;
      if (stored) { try { localStorage.setItem(key, stored); } catch (e) {} }
    }
    var pref=stored==="dark"||stored==="light"||stored==="system"?stored:"light";
    var systemDark=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches;
    var resolved=pref==="system"?(systemDark?"dark":"light"):pref;
    var root=document.documentElement;
    root.classList.toggle("dark", resolved==="dark");
    root.style.colorScheme=resolved;
  } catch (e) {}
})();`;
