import { describe, expect, it } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { redirectWithSessionCookies } from "./middleware";

describe("redirectWithSessionCookies", () => {
  it("copies refreshed session cookies onto the redirect", () => {
    const request = new NextRequest("http://localhost:3000/");
    const sessionResponse = NextResponse.next();
    sessionResponse.cookies.set("sb-access-token", "rotated", { path: "/", httpOnly: true });

    const redirect = redirectWithSessionCookies(request, sessionResponse, "/home");

    expect(redirect.headers.get("location")).toBe("http://localhost:3000/home");
    expect(redirect.cookies.get("sb-access-token")?.value).toBe("rotated");
  });
});
