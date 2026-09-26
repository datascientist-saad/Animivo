"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";
import { applyNativeSystemBars } from "@/lib/native/system-bars";
import {
  DEFAULT_THEME_PREFERENCE,
  persistThemePreference,
  THEME_COLORS,
  THEME_STORAGE_KEY,
  parseThemePreference,
} from "@/lib/theme";

function NativeThemeChrome() {
  const { theme, resolvedTheme } = useTheme();

  useEffect(() => {
    const preference = parseThemePreference(theme);
    if (preference) persistThemePreference(preference);
  }, [theme]);

  useEffect(() => {
    if (resolvedTheme !== "dark" && resolvedTheme !== "light") return;
    const isDark = resolvedTheme === "dark";
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute("content", isDark ? THEME_COLORS.dark.background : THEME_COLORS.light.background);
    void applyNativeSystemBars(isDark);
  }, [resolvedTheme]);

  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={DEFAULT_THEME_PREFERENCE}
      enableSystem
      storageKey={THEME_STORAGE_KEY}
      disableTransitionOnChange
    >
      <NativeThemeChrome />
      {children}
    </NextThemesProvider>
  );
}
