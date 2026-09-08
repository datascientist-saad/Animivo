/**
 * Extra path prefixes that belong to a tab whose canonical href is different.
 * Used so meal tracking under /health/nutrition still highlights Nutrition.
 */
const NAV_ALIASES: Record<string, readonly string[]> = {
  "/health/diet": ["/health/nutrition"],
  "/care-plan": ["/care"],
};

function matchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/**
 * Resolve which app-shell tab should look active for a pathname.
 * Longer, more specific hrefs win so /health/diet does not also activate /health.
 */
export function isAppNavActive(pathname: string, href: string, navHrefs: readonly string[]): boolean {
  const matching = navHrefs.filter((item) => pathMatchesNavHref(pathname, item));
  if (matching.length === 0) return false;
  const winner = matching.reduce((best, item) => (item.length > best.length ? item : best));
  return winner === href;
}

export function pathMatchesNavHref(pathname: string, href: string): boolean {
  if (href === "/home") return pathname === "/home";
  if (matchesPrefix(pathname, href)) return true;
  return (NAV_ALIASES[href] ?? []).some((alias) => matchesPrefix(pathname, alias));
}
