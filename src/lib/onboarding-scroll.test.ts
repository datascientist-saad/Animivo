import { afterEach, describe, expect, it, vi } from "vitest";
import {
  collectOnboardingScrollContainers,
  scheduleOnboardingScrollReset,
  scrollOnboardingToTop,
} from "./onboarding-scroll";

class FakeElement {
  id = "";
  scrollTop = 0;
  scrollLeft = 0;
  scrollHeight = 800;
  clientHeight = 400;
  parentElement: FakeElement | null = null;
  style = { overflowY: "visible" };

  constructor(init: Partial<FakeElement> = {}) {
    Object.assign(this, init);
  }
}

function installDom(opts: {
  main?: FakeElement | null;
  body?: FakeElement;
  documentElement?: FakeElement;
  scrollingElement?: FakeElement | null;
} = {}) {
  const documentElement = opts.documentElement ?? new FakeElement({ scrollTop: 0 });
  const body = opts.body ?? new FakeElement({ scrollTop: 0 });
  const main = opts.main === undefined ? new FakeElement({ id: "main-content", scrollTop: 240, scrollLeft: 12 }) : opts.main;

  vi.stubGlobal("HTMLElement", FakeElement);
  vi.stubGlobal("document", {
    getElementById: (id: string) => (id === "main-content" ? main : null),
    scrollingElement: opts.scrollingElement === undefined ? documentElement : opts.scrollingElement,
    documentElement,
    body,
  });

  const scrollTo = vi.fn();
  vi.stubGlobal("window", {
    scrollTo,
    getComputedStyle: (node: FakeElement) => ({ overflowY: node.style.overflowY }),
  });
  vi.stubGlobal("scrollTo", scrollTo);

  return { scrollTo, documentElement, body, main };
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("onboarding scroll reset", () => {
  it("resets the marketing main scroller and the window", () => {
    const { main, documentElement, body, scrollTo } = installDom({
      documentElement: new FakeElement({ scrollTop: 180 }),
      body: new FakeElement({ scrollTop: 90 }),
    });

    scrollOnboardingToTop();

    expect(main?.scrollTop).toBe(0);
    expect(main?.scrollLeft).toBe(0);
    expect(documentElement.scrollTop).toBe(0);
    expect(body.scrollTop).toBe(0);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("also resets overflow ancestors of the current step", () => {
    const outer = new FakeElement({ scrollTop: 240, style: { overflowY: "auto" } as FakeElement["style"] });
    const inner = new FakeElement({ parentElement: outer });
    installDom({ main: null });

    const containers = collectOnboardingScrollContainers(inner as unknown as HTMLElement);
    expect(containers.some((node) => node === (outer as unknown as HTMLElement))).toBe(true);

    scrollOnboardingToTop(inner as unknown as HTMLElement);
    expect(outer.scrollTop).toBe(0);
  });

  it("schedules a second reset after layout", () => {
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      frames.push(cb);
      return frames.length;
    });

    const { main } = installDom();
    scheduleOnboardingScrollReset();
    expect(main?.scrollTop).toBe(0);

    if (main) main.scrollTop = 310;
    frames[0]?.(0);
    expect(main?.scrollTop).toBe(0);

    if (main) main.scrollTop = 140;
    frames[1]?.(0);
    expect(main?.scrollTop).toBe(0);
  });
});
