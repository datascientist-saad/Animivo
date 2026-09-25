const SCROLLABLE_OVERFLOW = new Set(["auto", "scroll", "overlay"]);

function addScrollNode(nodes: HTMLElement[], seen: Set<HTMLElement>, node: Element | null | undefined) {
  if (node instanceof HTMLElement && !seen.has(node)) {
    seen.add(node);
    nodes.push(node);
  }
}

function isVerticallyScrollable(node: Element): node is HTMLElement {
  if (!(node instanceof HTMLElement)) return false;
  if (typeof window === "undefined" || typeof window.getComputedStyle !== "function") {
    return node.scrollHeight > node.clientHeight;
  }
  const { overflowY } = window.getComputedStyle(node);
  return SCROLLABLE_OVERFLOW.has(overflowY);
}

/** Scroll containers that can leave an onboarding step parked at the bottom. */
export function collectOnboardingScrollContainers(from?: HTMLElement | null): HTMLElement[] {
  if (typeof document === "undefined") return [];

  const nodes: HTMLElement[] = [];
  const seen = new Set<HTMLElement>();

  addScrollNode(nodes, seen, document.getElementById("main-content"));
  addScrollNode(
    nodes,
    seen,
    document.scrollingElement instanceof HTMLElement ? document.scrollingElement : null
  );
  addScrollNode(nodes, seen, document.documentElement);
  addScrollNode(nodes, seen, document.body);

  let current: HTMLElement | null | undefined = from;
  while (current) {
    if (isVerticallyScrollable(current)) addScrollNode(nodes, seen, current);
    current = current.parentElement;
  }

  return nodes;
}

function withInstantScroll(run: () => void) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const previous = root.style.scrollBehavior;
  root.style.scrollBehavior = "auto";
  try {
    run();
  } finally {
    root.style.scrollBehavior = previous;
  }
}

/** Instantly pin every onboarding scroller to the top so the heading is visible. */
export function scrollOnboardingToTop(from?: HTMLElement | null) {
  if (typeof document === "undefined") return;

  withInstantScroll(() => {
    for (const node of collectOnboardingScrollContainers(from)) {
      node.scrollTop = 0;
      node.scrollLeft = 0;
    }

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      window.scrollTo(0, 0);
    }
  });
}

/** Reset now and again after layout so a newly mounted step does not inherit scroll. */
export function scheduleOnboardingScrollReset(from?: HTMLElement | null) {
  scrollOnboardingToTop(from);

  const followUp = () => scrollOnboardingToTop(from);
  if (typeof requestAnimationFrame === "function") {
    requestAnimationFrame(() => {
      followUp();
      requestAnimationFrame(followUp);
    });
  }
  if (typeof setTimeout === "function") {
    setTimeout(followUp, 50);
    setTimeout(followUp, 120);
  }
}
