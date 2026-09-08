import { describe, expect, it } from "vitest";
import { isAppNavActive } from "./nav-active";

const navHrefs = [
  "/home",
  "/health/diet",
  "/health",
  "/care-plan",
  "/health/timeline",
  "/ai",
  "/profile",
  "/settings",
] as const;

function active(pathname: string) {
  return navHrefs.filter((href) => isAppNavActive(pathname, href, navHrefs));
}

describe("isAppNavActive", () => {
  it("activates only Nutrition on diet and nested diet routes", () => {
    expect(active("/health/diet")).toEqual(["/health/diet"]);
    expect(active("/health/diet/review")).toEqual(["/health/diet"]);
  });

  it("activates Nutrition on meal-tracking routes as well as the diet plan", () => {
    expect(active("/health/nutrition")).toEqual(["/health/diet"]);
  });

  it("activates only Health on the health hub and other health subpages", () => {
    expect(active("/health")).toEqual(["/health"]);
    expect(active("/health/weight")).toEqual(["/health"]);
    expect(active("/health/vaccinations")).toEqual(["/health"]);
    expect(active("/health/medications")).toEqual(["/health"]);
    expect(active("/health/records")).toEqual(["/health"]);
    expect(active("/health/symptoms")).toEqual(["/health"]);
  });

  it("activates only Records on the timeline", () => {
    expect(active("/health/timeline")).toEqual(["/health/timeline"]);
  });

  it("activates Today only on /home", () => {
    expect(active("/home")).toEqual(["/home"]);
  });

  it("activates Care Plan, AI, Profile, and Settings on their own routes", () => {
    expect(active("/care-plan")).toEqual(["/care-plan"]);
    expect(active("/care")).toEqual(["/care-plan"]);
    expect(active("/ai")).toEqual(["/ai"]);
    expect(active("/profile")).toEqual(["/profile"]);
    expect(active("/settings")).toEqual(["/settings"]);
  });
});
