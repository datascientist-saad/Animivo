"use client";

import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONNECTION_MESSAGE } from "@/lib/native/network";

export function ConnectionErrorState({
  message = CONNECTION_MESSAGE,
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-[50dvh] flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <AlertCircle className="size-8 text-accent" />
      <p className="max-w-sm text-sm text-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" className="rounded-xl" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
