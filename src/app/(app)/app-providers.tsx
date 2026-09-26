"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PetSelector } from "@/components/pets/pet-selector";
import { MissingConfigScreen, hasSupabaseConfig } from "@/components/shared/missing-config";
import { PetProvider, usePet } from "@/contexts/pet-context";
import { UserProvider } from "@/contexts/user-context";
import { CareReminderSync } from "@/components/native/care-reminder-sync";
import { LoadingState } from "@/components/shared/page-states";
import { hasPendingOnboardingDraft } from "@/lib/onboarding-draft";

function AppLayoutInner({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { pets, loading } = usePet();

  useEffect(() => {
    if (loading) return;
    const onOnboarding = pathname.startsWith("/onboarding") || pathname.startsWith("/setup");
    if (!pets.length && !onOnboarding) {
      if (hasPendingOnboardingDraft()) {
        router.replace("/setup/complete");
      } else {
        router.replace("/onboarding");
      }
    }
  }, [pets.length, loading, pathname, router]);

  if (loading && !pathname.startsWith("/onboarding") && !pathname.startsWith("/setup")) {
    return (
      <AppShell petSelector={<PetSelector />}>
        <LoadingState message="Getting things ready for you and your pets…" />
      </AppShell>
    );
  }

  return <AppShell petSelector={<PetSelector />}>{children}</AppShell>;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  if (!hasSupabaseConfig()) {
    return <MissingConfigScreen />;
  }

  return (
    <UserProvider>
      <PetProvider>
        <CareReminderSync />
        <AppLayoutInner>{children}</AppLayoutInner>
      </PetProvider>
    </UserProvider>
  );
}
