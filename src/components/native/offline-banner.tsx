"use client";

import { useCallback, useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CONNECTION_MESSAGE, isBrowserOffline } from "@/lib/native/network";

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  const refresh = useCallback(() => {
    setOffline(isBrowserOffline());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("online", refresh);
    window.addEventListener("offline", refresh);

    let handle: { remove: () => Promise<void> } | undefined;
    void (async () => {
      try {
        const { Capacitor } = await import("@capacitor/core");
        if (!Capacitor.isNativePlatform()) return;
        const { Network } = await import("@capacitor/network");
        const status = await Network.getStatus();
        setOffline(!status.connected);
        handle = await Network.addListener("networkStatusChange", (next) => {
          setOffline(!next.connected);
        });
      } catch {
        // Web-only path uses window online/offline events.
      }
    })();

    return () => {
      window.removeEventListener("online", refresh);
      window.removeEventListener("offline", refresh);
      void handle?.remove();
    };
  }, [refresh]);

  if (!offline) return null;

  return (
    <div
      className="fixed inset-x-0 top-0 z-[60] border-b border-border bg-card px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] shadow-sm"
      role="status"
    >
      <div className="mx-auto flex max-w-lg items-start gap-3">
        <WifiOff className="mt-0.5 size-5 shrink-0 text-accent" aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">No connection</p>
          <p className="text-xs text-muted-foreground">{CONNECTION_MESSAGE}</p>
        </div>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => window.location.reload()}>
          Retry
        </Button>
      </div>
    </div>
  );
}
