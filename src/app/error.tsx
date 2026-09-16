"use client";

import { useEffect } from "react";
import { ConnectionErrorState } from "@/components/native/connection-error-state";
import { brand } from "@/lib/brand";
import { CONNECTION_MESSAGE, isNetworkError } from "@/lib/native/network";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[Animivo]", error);
    }
  }, [error]);

  const message = isNetworkError(error)
    ? CONNECTION_MESSAGE
    : "Something went wrong in Animivo. You can try again without leaving your pet’s plan.";

  return (
    <div className="min-h-dvh bg-background px-4 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
      <p className="mb-8 text-center font-[family-name:var(--font-display)] text-lg font-semibold">{brand.name}</p>
      <ConnectionErrorState message={message} onRetry={reset} />
    </div>
  );
}
