"use client";

import { ConnectionErrorState } from "@/components/native/connection-error-state";
import { brand } from "@/lib/brand";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  if (process.env.NODE_ENV !== "production") {
    console.error("[Animivo]", error);
  }

  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#faf7f2] text-[#2c2a26]">
        <div className="px-4 pt-16">
          <p className="mb-8 text-center text-lg font-semibold">{brand.name}</p>
          <ConnectionErrorState
            message="Animivo hit an unexpected problem. Retry to return to your care plan."
            onRetry={reset}
          />
        </div>
      </body>
    </html>
  );
}
