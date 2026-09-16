import { NextResponse } from "next/server";
import { NATIVE_APP_ID } from "@/lib/native/constants";

export const dynamic = "force-static";

export function GET() {
  const fingerprints = (process.env.NEXT_PUBLIC_ANDROID_SHA256_CERTS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const body = [
    {
      relation: ["delegate_permission/common.handle_all_urls"],
      target: {
        namespace: "android_app",
        package_name: NATIVE_APP_ID,
        sha256_cert_fingerprints: fingerprints.length
          ? fingerprints
          : ["REPLACE_WITH_PLAY_APP_SIGNING_CERT_SHA256"],
      },
    },
  ];

  return NextResponse.json(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
