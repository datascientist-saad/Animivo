export const CONNECTION_MESSAGE =
  "Animivo can't reach the care service right now. Check your connection and try again.";

export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}

export function isNetworkError(error: unknown): boolean {
  if (isBrowserOffline()) return true;
  if (error instanceof TypeError) {
    return /fetch|network|failed to fetch|load failed|internet/i.test(error.message);
  }
  if (error instanceof Error) {
    return /failed to fetch|networkerror|network request failed|load failed|err_internet|offline/i.test(
      error.message
    );
  }
  return false;
}
