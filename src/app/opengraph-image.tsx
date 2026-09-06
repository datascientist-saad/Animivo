import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { brand } from "@/lib/brand";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function logoDataUri() {
  const bytes = readFileSync(join(process.cwd(), "public/brand/animivo-logo.png"));
  return `data:image/png;base64,${bytes.toString("base64")}`;
}

export default function OpenGraphImage() {
  const logoSrc = logoDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: brand.colors.background,
          color: brand.colors.foreground,
        }}
      >
        <img src={logoSrc} alt="" width={280} height={170} style={{ objectFit: "contain" }} />
        <div
          style={{
            fontSize: 56,
            fontWeight: 500,
            lineHeight: 1.05,
            maxWidth: 900,
            marginTop: 28,
          }}
        >
          {brand.tagline}
        </div>
        <div
          style={{
            fontSize: 26,
            marginTop: 20,
            color: brand.colors.mutedForeground,
            maxWidth: 800,
          }}
        >
          {brand.subtitle}
        </div>
      </div>
    ),
    size
  );
}
