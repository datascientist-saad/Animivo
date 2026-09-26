import { afterEach, describe, expect, it } from "vitest";
import {
  DEFAULT_THEME_PREFERENCE,
  parseThemePreference,
  persistThemePreference,
  readStoredThemePreference,
  resolveThemePreference,
  THEME_STORAGE_KEY,
} from "./theme";

const memory = new Map<string, string>();

const localStorageMock = {
  getItem: (key: string) => memory.get(key) ?? null,
  setItem: (key: string, value: string) => {
    memory.set(key, value);
  },
  removeItem: (key: string) => {
    memory.delete(key);
  },
};

Object.defineProperty(globalThis, "localStorage", { configurable: true, value: localStorageMock });
Object.defineProperty(globalThis, "window", { configurable: true, value: { localStorage: localStorageMock } });
Object.defineProperty(globalThis, "document", { configurable: true, value: { cookie: "" } });

afterEach(() => {
  memory.clear();
  document.cookie = "";
});

describe("theme preference", () => {
  it("defaults to the current light theme", () => {
    expect(DEFAULT_THEME_PREFERENCE).toBe("light");
    expect(parseThemePreference("midnight")).toBeNull();
    expect(parseThemePreference("dark")).toBe("dark");
    expect(parseThemePreference("system")).toBe("system");
  });

  it("resolves system to the device scheme", () => {
    expect(resolveThemePreference("system", true)).toBe("dark");
    expect(resolveThemePreference("system", false)).toBe("light");
    expect(resolveThemePreference("light", true)).toBe("light");
    expect(resolveThemePreference("dark", false)).toBe("dark");
  });

  it("persists the choice for the next app launch", () => {
    persistThemePreference("dark");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.cookie).toContain("animivo-theme=dark");
    expect(readStoredThemePreference()).toBe("dark");
  });

  it("restores from the cookie when localStorage is empty", () => {
    document.cookie = "animivo-theme=system";
    expect(readStoredThemePreference()).toBe("system");
  });
});
