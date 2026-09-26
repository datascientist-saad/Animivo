import type { SupabaseClient } from "@supabase/supabase-js";
import {
  buildCareReminders,
  DEFAULT_NOTIFICATION_PREFS,
  mealsFromDietResult,
  type BuildCareRemindersInput,
  type CareReminder,
  type ReminderPetInput,
} from "@/lib/native/care-reminders";
import { cancelAllCareReminders, scheduleCareReminders } from "@/lib/native/local-notifications";
import { CareTaskService } from "@/services/care-task-service";
import { DietPlanService } from "@/services/diet-plan-service";
import { MedicationService } from "@/services/medication-service";
import { VaccinationService } from "@/services/vaccination-service";
import type { NotificationPreferences } from "@/types/database";

export function toReminderPet(pet: ReminderPetInput): ReminderPetInput {
  return {
    id: pet.id,
    name: pet.name,
    species: pet.species,
    meals_per_day: pet.meals_per_day ?? null,
  };
}

export async function loadCareReminderInput(
  supabase: SupabaseClient,
  pets: ReminderPetInput[],
  prefs?: Partial<NotificationPreferences> | null
): Promise<BuildCareRemindersInput> {
  const input: BuildCareRemindersInput = {
    pets: pets.map(toReminderPet),
    tasks: [],
    meals: [],
    vaccines: [],
    medications: [],
    prefs: { ...DEFAULT_NOTIFICATION_PREFS, ...prefs },
  };

  await Promise.all(
    pets.map(async (pet) => {
      try {
        const [tasks, plan, vaccines, medications] = await Promise.all([
          new CareTaskService(supabase).list(pet.id),
          new DietPlanService(supabase).getCurrent(pet.id),
          new VaccinationService(supabase).list(pet.id),
          new MedicationService(supabase).list(pet.id),
        ]);
        input.tasks?.push(...tasks);
        input.meals?.push(...mealsFromDietResult(pet.id, plan?.result ?? null));
        input.vaccines?.push(...vaccines);
        input.medications?.push(...medications);
      } catch {
        // Keep other pets' reminders if one fetch fails.
      }
    })
  );

  return input;
}

export async function previewCareReminders(
  supabase: SupabaseClient,
  pets: ReminderPetInput[],
  prefs?: Partial<NotificationPreferences> | null
): Promise<CareReminder[]> {
  const input = await loadCareReminderInput(supabase, pets, prefs);
  return buildCareReminders(input);
}

export async function syncDeviceCareReminders(
  supabase: SupabaseClient,
  pets: ReminderPetInput[],
  prefs?: Partial<NotificationPreferences> | null
): Promise<CareReminder[]> {
  if (!pets.length) {
    await cancelAllCareReminders();
    return [];
  }
  const reminders = await previewCareReminders(supabase, pets, prefs);
  await scheduleCareReminders(reminders);
  return reminders;
}
