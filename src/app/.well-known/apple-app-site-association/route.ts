import { NextResponse } from "next/server";
import { NATIVE_APP_ID } from "@/lib/native/constants";

export const dynamic = "force-static";

export function GET() {
  const teamId = process.env.NEXT_PUBLIC_IOS_TEAM_ID?.trim();
  const appId = teamId ? `${teamId}.${NATIVE_APP_ID}` : `TEAMID.${NATIVE_APP_ID}`;

  const body = {
    applinks: {
      apps: [],
      details: [
        {
          appID: appId,
          paths: [
            "/auth/callback",
            "/auth/callback/*",
            "/invite/*",
            "/reset-password",
            "/login",
            "/home",
          ],
        },
      ],
    },
    webcredentials: {
      apps: [appId],
    },
  };

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
