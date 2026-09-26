"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SegmentedSelector } from "@/components/shared/segmented-selector";
import {
  DEFAULT_THEME_PREFERENCE,
  persistThemePreference,
  parseThemePreference,
  type ThemePreference,
} from "@/lib/theme";

const OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: "light", label: "Light", description: "Current cream theme" },
  { value: "dark", label: "Dark", description: "Dim for low light" },
  { value: "system", label: "System", description: "Match this device" },
];

export function AppearanceSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const value = (mounted && parseThemePreference(theme)) || DEFAULT_THEME_PREFERENCE;

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-base">Appearance</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Choose Light, Dark, or follow the Android system setting. Your choice is saved on this
          device.
        </p>
        <SegmentedSelector
          id="theme-preference"
          ariaLabel="Color theme"
          columns={3}
          className="grid-cols-3"
          value={value}
          onChange={(next) => {
            persistThemePreference(next);
            setTheme(next);
          }}
          options={OPTIONS}
        />
      </CardContent>
    </Card>
  );
}
