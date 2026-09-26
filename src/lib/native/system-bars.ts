import { THEME_COLORS } from "@/lib/theme";

export async function applyNativeSystemBars(isDark: boolean) {
  const colors = isDark ? THEME_COLORS.dark : THEME_COLORS.light;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: isDark ? Style.Light : Style.Dark });
    await StatusBar.setBackgroundColor({ color: colors.background });
  } catch {
    // Status bar plugin is optional on some simulators.
  }
}
