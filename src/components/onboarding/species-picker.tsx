"use client";

import { PawPrint, Plus } from "lucide-react";
import { SUPPORTED_SPECIES } from "@/lib/species/registry";
import { cn } from "@/lib/utils";
import type { OnboardingDraftData } from "@/types/onboarding-draft";

interface SpeciesPickerProps {
  value: OnboardingDraftData["species"];
  onChange: (value: OnboardingDraftData["species"]) => void;
  id?: string;
}

export function SpeciesPicker({ value, onChange, id = "species" }: SpeciesPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      <div id={id} className="contents" role="radiogroup" aria-label="Pet type">
        {SUPPORTED_SPECIES.map((species) => {
          const selected = value === species.id;
          return (
            <button
              key={species.id}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(species.id as OnboardingDraftData["species"])}
              className={cn(
                "flex min-h-[5.75rem] flex-col justify-center rounded-2xl border px-3 py-3 text-left transition-all",
                selected
                  ? "border-primary bg-primary/10 text-foreground shadow-sm"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:bg-secondary/60"
              )}
            >
              <span className="text-lg leading-none" aria-hidden>
                {species.icon}
              </span>
              <span className="mt-2 block text-sm font-medium text-foreground">{species.displayName}</span>
            </button>
          );
        })}
      </div>

      <div
        role="note"
        className="flex min-h-[5.75rem] cursor-not-allowed flex-col justify-center rounded-2xl border border-dashed border-border/80 bg-muted/40 px-3 py-3 text-left text-muted-foreground"
      >
        <span className="relative inline-flex size-8 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <PawPrint className="size-4" aria-hidden />
          <Plus className="absolute -right-0.5 -top-0.5 size-3" aria-hidden />
        </span>
        <span className="mt-2 block text-sm font-medium text-foreground/80">More pets coming soon</span>
        <span className="mt-0.5 block text-[11px] leading-snug">
          We’re working on support for more types of pets.
        </span>
      </div>
    </div>
  );
}
