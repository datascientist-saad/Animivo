import { AUTH_HANDOFF_PATHS, NATIVE_TAB_ROOTS } from "@/lib/native/constants";

export function normalizePathname(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function isNativeRootPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return (NATIVE_TAB_ROOTS as readonly string[]).includes(path);
}

export function isAuthHandoffPath(pathname: string): boolean {
  const path = normalizePathname(pathname);
  return (AUTH_HANDOFF_PATHS as readonly string[]).some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

export function shouldExitOnBack(pathname: string): boolean {
  return isNativeRootPath(pathname);
}

export function hasDismissibleOverlay(root: ParentNode = document): boolean {
  return Boolean(
    root.querySelector(
      '[role="dialog"][data-state="open"], [data-state="open"][data-radix-dialog-content], [data-state="open"][data-radix-alert-dialog-content]'
    )
  );
}

export function dismissTopOverlay(): boolean {
  if (typeof document === "undefined") return false;
  if (!hasDismissibleOverlay()) return false;
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  return true;
}
