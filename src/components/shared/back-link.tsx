"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackLinkProps {
  fallbackHref: string;
  label?: string;
  onClick?: () => void;
  className?: string;
}

export function BackLink({
  fallbackHref,
  label = "Go back",
  onClick,
  className,
}: BackLinkProps) {
  const router = useRouter();

  function handleClick() {
    if (onClick) {
      onClick();
      return;
    }
    if (typeof window !== "undefined") {
      const referrer = document.referrer;
      if (referrer) {
        try {
          const url = new URL(referrer);
          if (url.origin === window.location.origin) {
            router.back();
            return;
          }
        } catch {
          // Fall through to the parent route.
        }
      }
    }
    router.push(fallbackHref);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      onClick={handleClick}
      className={cn("min-h-11 min-w-11 shrink-0 rounded-xl", className)}
    >
      <ArrowLeft className="size-5" aria-hidden />
    </Button>
  );
}
