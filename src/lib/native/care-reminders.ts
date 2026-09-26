import type { CareCategory, NotificationPreferences } from "@/types/database";

export const CARE_REMINDERS_REFRESH_EVENT = "animivo:reminders-refresh";
export const CARE_REMINDER_LIMIT = 60;

export const DEFAULT_NOTIFICATION_PREFS: NotificationPreferences = {
  care_reminders: true,
  vaccination_alerts: true,
  medication_alerts: true,
  weight_suggestions: true,
  email_digest: false,
};

export type ReminderKind = "meal" | "weight" | "vaccine" | "medication" | "care";
export type ReminderRepeat = "once" | "daily" | "weekly" | "monthly";

export interface CareReminder {
  key: string;
  id: number;
  kind: ReminderKind;
  title: string;
  body: string;
  path: string;
  hour: number;
  minute: number;
  weekday?: number;
  dayOfMonth?: number;
  at?: string;
  repeat: ReminderRepeat;
  nextAt: string;
  petId: string;
  petName: string;
}

export interface ReminderPetInput {
  id: string;
  name: string;
  species: string;
  meals_per_day?: number | null;
}

export interface ReminderTaskInput {
  id: string;
  pet_id: string;
  title: string;
  category: CareCategory;
  frequency: string;
  scheduled_time: string | null;
  next_due_at: string | null;
  active: boolean;
  custom_interval_days?: number | null;
}

export interface ReminderMealInput {
  pet_id: string;
  label: string;
  time: string;
}

export interface ReminderVaccineInput {
  id: string;
  pet_id: string;
  name: string;
  next_due_date: string | null;
  status: string;
}

export interface ReminderMedInput {
  id: string;
  pet_id: string;
  name: string;
  dose: string;
  unit: string;
  frequency: string;
  status: string;
  end_date: string | null;
}

export interface ReminderWeightInput {
  pet_id: string;
  recorded_at: string;
}

export interface BuildCareRemindersInput {
  pets: ReminderPetInput[];
  tasks?: ReminderTaskInput[];
  meals?: ReminderMealInput[];
  vaccines?: ReminderVaccineInput[];
  medications?: ReminderMedInput[];
  weights?: ReminderWeightInput[];
  prefs?: Partial<NotificationPreferences> | null;
  now?: Date;
  limit?: number;
}

const KIND_RANK: Record<ReminderKind, number> = {
  meal: 0,
  medication: 1,
  weight: 2,
  vaccine: 3,
  care: 4,
};

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function dispatchCareRemindersRefresh() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(CARE_REMINDERS_REFRESH_EVENT));
}

export function parseClock(value: string | null | undefined): { hour: number; minute: number } | null {
  if (!value) return null;
  const match = /^(\d{1,2}):(\d{2})/.exec(value.trim());
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }
  return { hour, minute };
}

export function defaultMealTimes(mealsPerDay: number): string[] {
  if (mealsPerDay >= 4) return ["07:00", "12:00", "17:00", "21:00"];
  if (mealsPerDay === 3) return ["08:00", "13:00", "18:00"];
  if (mealsPerDay === 1) return ["09:00"];
  if (mealsPerDay <= 0) return [];
  return ["08:00", "18:00"];
}

export function mealsFromDietResult(
  petId: string,
  result: Record<string, unknown> | null | undefined
): ReminderMealInput[] {
  const schedule = result?.mealSchedule;
  if (!Array.isArray(schedule)) return [];
  const meals: ReminderMealInput[] = [];
  for (const item of schedule) {
    if (!item || typeof item !== "object") continue;
    const record = item as { time?: unknown; label?: unknown };
    if (typeof record.time !== "string" || !parseClock(record.time)) continue;
    meals.push({
      pet_id: petId,
      label: typeof record.label === "string" && record.label.trim() ? record.label.trim() : "Meal",
      time: record.time,
    });
  }
  return meals;
}

export function medicationTimes(frequency: string): string[] {
  const value = frequency.toLowerCase();
  if (/\b(every\s*8|q8|8\s*hours?)\b/.test(value)) return ["08:00", "16:00", "00:00"];
  if (/\b(three|thrice|tid|3x|3\s*times?)\b/.test(value)) return ["08:00", "14:00", "20:00"];
  if (/\b(twice|bid|2x|2\s*times?|every\s*12|12\s*hours?)\b/.test(value)) return ["08:00", "20:00"];
  return ["09:00"];
}

export function reminderNotificationId(key: string): number {
  let hash = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    hash ^= key.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % 2_147_482_647 + 1;
}

export function formatClockLabel(hour: number, minute: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${String(minute).padStart(2, "0")} ${suffix}`;
}

export function formatReminderWhen(reminder: CareReminder): string {
  const clock = formatClockLabel(reminder.hour, reminder.minute);
  if (reminder.repeat === "daily") return `Every day · ${clock}`;
  if (reminder.repeat === "weekly") {
    const label = WEEKDAY_LABELS[(reminder.weekday ?? 1) - 1] ?? "Sunday";
    return `${label}s · ${clock}`;
  }
  if (reminder.repeat === "monthly") return `Monthly · ${clock}`;
  if (reminder.at) {
    const date = new Date(reminder.at);
    const month = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${month} · ${clock}`;
  }
  return clock;
}

export function nextOccurrence(reminder: Pick<CareReminder, "repeat" | "hour" | "minute" | "weekday" | "dayOfMonth" | "at">, now: Date): Date {
  if (reminder.repeat === "once" && reminder.at) {
    return new Date(reminder.at);
  }
  if (reminder.repeat === "weekly") {
    return nextWeekday(now, reminder.weekday ?? 1, reminder.hour, reminder.minute);
  }
  if (reminder.repeat === "monthly") {
    return nextMonthDay(now, reminder.dayOfMonth ?? 1, reminder.hour, reminder.minute);
  }
  return nextDaily(now, reminder.hour, reminder.minute);
}

export function buildCareReminders(input: BuildCareRemindersInput): CareReminder[] {
  const now = input.now ?? new Date();
  const prefs = { ...DEFAULT_NOTIFICATION_PREFS, ...input.prefs };
  const limit = input.limit ?? CARE_REMINDER_LIMIT;
  const pets = input.pets ?? [];
  const petById = new Map(pets.map((pet) => [pet.id, pet]));
  const used = new Set<string>();
  const draft: Array<Omit<CareReminder, "id" | "nextAt"> & { nextAt?: string }> = [];

  function remember(slot: string) {
    if (used.has(slot)) return false;
    used.add(slot);
    return true;
  }

  function push(reminder: Omit<CareReminder, "id" | "nextAt">) {
    const nextAt = nextOccurrence(reminder, now);
    if (reminder.repeat === "once" && nextAt.getTime() <= now.getTime()) return;
    draft.push({ ...reminder, nextAt: nextAt.toISOString() });
  }

  for (const task of input.tasks ?? []) {
    if (!task.active) continue;
    const pet = petById.get(task.pet_id);
    if (!pet) continue;
    const prefKey = prefForCategory(task.category);
    if (!prefs[prefKey]) continue;
    const built = reminderFromTask(task, pet, now);
    if (!built) continue;
    const clock = clockKey(built.hour, built.minute);
    if (!remember(`${built.kind}:${pet.id}:${clock}`)) continue;
    push(built);
  }

  if (prefs.care_reminders) {
    for (const meal of input.meals ?? []) {
      const pet = petById.get(meal.pet_id);
      const clock = parseClock(meal.time);
      if (!pet || !clock) continue;
      if (!remember(`meal:${pet.id}:${clockKey(clock.hour, clock.minute)}`)) continue;
      push({
        key: `meal:${pet.id}:${clockKey(clock.hour, clock.minute)}`,
        kind: "meal",
        title: `Time to feed ${pet.name}`,
        body: `${meal.label} is on the plan.`,
        path: "/health/diet",
        hour: clock.hour,
        minute: clock.minute,
        repeat: "daily",
        petId: pet.id,
        petName: pet.name,
      });
    }

    for (const pet of pets) {
      const mealsPerDay = pet.meals_per_day ?? 0;
      if (mealsPerDay <= 0) continue;
      const hasMeal = [...used].some((slot) => slot.startsWith(`meal:${pet.id}:`));
      if (hasMeal) continue;
      for (const [index, time] of defaultMealTimes(mealsPerDay).entries()) {
        const clock = parseClock(time);
        if (!clock) continue;
        if (!remember(`meal:${pet.id}:${clockKey(clock.hour, clock.minute)}`)) continue;
        push({
          key: `meal-default:${pet.id}:${time}`,
          kind: "meal",
          title: `Time to feed ${pet.name}`,
          body: `Meal ${index + 1} is coming up.`,
          path: "/health/diet",
          hour: clock.hour,
          minute: clock.minute,
          repeat: "daily",
          petId: pet.id,
          petName: pet.name,
        });
      }
    }
  }

  if (prefs.weight_suggestions) {
    for (const pet of pets) {
      if ([...used].some((slot) => slot.startsWith(`weight:${pet.id}:`))) continue;
      const fallback = weightFallback(pet);
      if (!remember(`weight:${pet.id}:${clockKey(fallback.hour, fallback.minute)}`)) continue;
      push(fallback);
    }
  }

  if (prefs.vaccination_alerts) {
    for (const vaccine of input.vaccines ?? []) {
      if (vaccine.status === "completed" || !vaccine.next_due_date) continue;
      const pet = petById.get(vaccine.pet_id);
      if (!pet) continue;
      const due = parseLocalDate(vaccine.next_due_date);
      if (!due) continue;
      const dueDay = startOfLocalDay(due);
      const today = startOfLocalDay(now);
      const days = Math.round((dueDay.getTime() - today.getTime()) / 86_400_000);

      if (days < 0) {
        const at = nextDaily(now, 9, 0);
        push({
          key: `vaccine:${vaccine.id}:overdue`,
          kind: "vaccine",
          title: `${pet.name}'s ${vaccine.name} is overdue`,
          body: "Open Animivo to update their vaccine record.",
          path: "/health/vaccinations",
          hour: 9,
          minute: 0,
          at: at.toISOString(),
          repeat: "once",
          petId: pet.id,
          petName: pet.name,
        });
        continue;
      }

      if (days >= 1) {
        const eve = atLocal(addDays(dueDay, -1), 9, 0);
        if (eve.getTime() > now.getTime()) {
          push({
            key: `vaccine:${vaccine.id}:eve`,
            kind: "vaccine",
            title: `${pet.name}'s ${vaccine.name} is due tomorrow`,
            body: "A quick check-in keeps their care on track.",
            path: "/health/vaccinations",
            hour: 9,
            minute: 0,
            at: eve.toISOString(),
            repeat: "once",
            petId: pet.id,
            petName: pet.name,
          });
        }
      }

      const dayOf = atLocal(dueDay, 9, 0);
      if (dayOf.getTime() > now.getTime()) {
        push({
          key: `vaccine:${vaccine.id}:due`,
          kind: "vaccine",
          title: `${pet.name}'s ${vaccine.name} is due today`,
          body: "Open Animivo to mark it done or book the visit.",
          path: "/health/vaccinations",
          hour: 9,
          minute: 0,
          at: dayOf.toISOString(),
          repeat: "once",
          petId: pet.id,
          petName: pet.name,
        });
      }
    }
  }

  if (prefs.medication_alerts) {
    const petsWithMedTasks = new Set(
      (input.tasks ?? [])
        .filter((task) => task.active && task.category === "medication")
        .map((task) => task.pet_id)
    );
    for (const med of input.medications ?? []) {
      if (med.status !== "active") continue;
      if (med.end_date && startOfLocalDay(parseLocalDate(med.end_date) ?? new Date(med.end_date)) < startOfLocalDay(now)) {
        continue;
      }
      const pet = petById.get(med.pet_id);
      if (!pet || petsWithMedTasks.has(pet.id)) continue;
      for (const time of medicationTimes(med.frequency)) {
        const clock = parseClock(time);
        if (!clock) continue;
        if (!remember(`medication:${pet.id}:${clockKey(clock.hour, clock.minute)}`)) continue;
        const dose = [med.dose, med.unit].filter(Boolean).join(" ");
        push({
          key: `med:${med.id}:${time}`,
          kind: "medication",
          title: `Time for ${pet.name}'s ${med.name}`,
          body: dose ? `${dose} is due.` : "Open Animivo to log their medication.",
          path: "/health/medications",
          hour: clock.hour,
          minute: clock.minute,
          repeat: "daily",
          petId: pet.id,
          petName: pet.name,
        });
      }
    }
  }

  const uniqueIds = new Set<number>();
  const reminders = draft
    .map((item) => {
      let id = reminderNotificationId(item.key);
      while (uniqueIds.has(id)) id += 1;
      uniqueIds.add(id);
      return {
        ...item,
        id,
        nextAt: item.nextAt ?? nextOccurrence(item, now).toISOString(),
      };
    })
    .sort((a, b) => {
      const byTime = a.nextAt.localeCompare(b.nextAt);
      if (byTime !== 0) return byTime;
      const byKind = KIND_RANK[a.kind] - KIND_RANK[b.kind];
      if (byKind !== 0) return byKind;
      return a.title.localeCompare(b.title);
    });

  return reminders.slice(0, limit);
}

function prefForCategory(category: CareCategory): keyof NotificationPreferences {
  if (category === "weight") return "weight_suggestions";
  if (category === "vaccination") return "vaccination_alerts";
  if (category === "medication") return "medication_alerts";
  return "care_reminders";
}

function kindForCategory(category: CareCategory): ReminderKind {
  if (category === "food") return "meal";
  if (category === "weight") return "weight";
  if (category === "vaccination") return "vaccine";
  if (category === "medication") return "medication";
  return "care";
}

function pathForKind(kind: ReminderKind): string {
  if (kind === "meal") return "/health/diet";
  if (kind === "weight") return "/health/weight";
  if (kind === "vaccine") return "/health/vaccinations";
  if (kind === "medication") return "/health/medications";
  return "/care-plan";
}

function reminderFromTask(
  task: ReminderTaskInput,
  pet: ReminderPetInput,
  now: Date
): Omit<CareReminder, "id" | "nextAt"> | null {
  const clock =
    parseClock(task.scheduled_time) ?? parseClockFromIso(task.next_due_at) ?? { hour: 9, minute: 0 };
  const kind = kindForCategory(task.category);
  const copy = copyForTask(task, pet, kind);
  const base = {
    key: `task:${task.id}`,
    kind,
    title: copy.title,
    body: copy.body,
    path: pathForKind(kind),
    hour: clock.hour,
    minute: clock.minute,
    petId: pet.id,
    petName: pet.name,
  };

  if (task.frequency === "daily" || task.custom_interval_days === 1) {
    return { ...base, repeat: "daily" };
  }
  if (task.frequency === "weekly" || task.custom_interval_days === 7) {
    return {
      ...base,
      repeat: "weekly",
      weekday: weekdayFromIso(task.next_due_at, now),
    };
  }
  if (task.frequency === "monthly") {
    return {
      ...base,
      repeat: "monthly",
      dayOfMonth: dayFromIso(task.next_due_at, now),
    };
  }
  if (task.frequency === "once") {
    const at = task.next_due_at ? new Date(task.next_due_at) : atLocal(startOfLocalDay(now), clock.hour, clock.minute);
    if (Number.isNaN(at.getTime()) || at.getTime() <= now.getTime()) return null;
    return { ...base, repeat: "once", at: at.toISOString() };
  }
  if (task.next_due_at) {
    const at = new Date(task.next_due_at);
    if (!Number.isNaN(at.getTime()) && at.getTime() > now.getTime()) {
      return { ...base, repeat: "once", at: at.toISOString() };
    }
  }
  return { ...base, repeat: "daily" };
}

function copyForTask(task: ReminderTaskInput, pet: ReminderPetInput, kind: ReminderKind): { title: string; body: string } {
  if (kind === "meal") return { title: `Time to feed ${pet.name}`, body: task.title };
  if (kind === "weight") return { title: `Time to weigh ${pet.name}`, body: task.title };
  if (kind === "medication") return { title: `Time for ${pet.name}'s medication`, body: task.title };
  if (kind === "vaccine") return { title: `${pet.name} has a vaccine check-in`, body: task.title };
  if (task.category === "activity") return { title: `Play time with ${pet.name}`, body: task.title };
  if (task.category === "grooming") return { title: `${pet.name}'s grooming reminder`, body: task.title };
  if (task.category === "vet") return { title: `${pet.name} has a vet reminder`, body: task.title };
  return { title: task.title, body: `A care reminder for ${pet.name}.` };
}

function weightFallback(pet: ReminderPetInput): Omit<CareReminder, "id" | "nextAt"> {
  if (pet.species === "bird") {
    return {
      key: `weight-fallback:${pet.id}`,
      kind: "weight",
      title: `Time to weigh ${pet.name}`,
      body: "A quick daily weight check helps spot changes early.",
      path: "/health/weight",
      hour: 8,
      minute: 0,
      repeat: "daily",
      petId: pet.id,
      petName: pet.name,
    };
  }
  return {
    key: `weight-fallback:${pet.id}`,
    kind: "weight",
    title: `Weight check for ${pet.name}`,
    body: "Log their weight so we can keep the plan on track.",
    path: "/health/weight",
    hour: 10,
    minute: 0,
    weekday: 1,
    repeat: "weekly",
    petId: pet.id,
    petName: pet.name,
  };
}

function clockKey(hour: number, minute: number): string {
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function parseClockFromIso(value: string | null | undefined): { hour: number; minute: number } | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return { hour: date.getHours(), minute: date.getMinutes() };
}

function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), 0, 0, 0, 0);
}

function startOfLocalDay(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
}

function atLocal(day: Date, hour: number, minute: number): Date {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute, 0, 0);
}

function addDays(value: Date, amount: number): Date {
  const next = new Date(value);
  next.setDate(next.getDate() + amount);
  return next;
}

function nextDaily(now: Date, hour: number, minute: number): Date {
  const candidate = atLocal(now, hour, minute);
  if (candidate.getTime() > now.getTime()) return candidate;
  return addDays(candidate, 1);
}

function nextWeekday(now: Date, weekday: number, hour: number, minute: number): Date {
  const target = ((weekday - 1) % 7 + 7) % 7;
  const candidate = atLocal(now, hour, minute);
  const delta = (target - now.getDay() + 7) % 7;
  if (delta === 0 && candidate.getTime() > now.getTime()) return candidate;
  if (delta === 0) return addDays(candidate, 7);
  return addDays(candidate, delta);
}

function nextMonthDay(now: Date, dayOfMonth: number, hour: number, minute: number): Date {
  const day = Math.min(Math.max(dayOfMonth, 1), 28);
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), day, hour, minute, 0, 0);
  if (thisMonth.getTime() > now.getTime()) return thisMonth;
  return new Date(now.getFullYear(), now.getMonth() + 1, day, hour, minute, 0, 0);
}

function weekdayFromIso(value: string | null | undefined, now: Date): number {
  if (value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return date.getDay() + 1;
  }
  return now.getDay() + 1;
}

function dayFromIso(value: string | null | undefined, now: Date): number {
  if (value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) return Math.min(date.getDate(), 28);
  }
  return Math.min(now.getDate(), 28);
}
