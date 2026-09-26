import { describe, expect, it } from "vitest";
import {
  buildCareReminders,
  defaultMealTimes,
  formatReminderWhen,
  mealsFromDietResult,
  medicationTimes,
  reminderNotificationId,
} from "@/lib/native/care-reminders";
import type { ReminderPetInput, ReminderTaskInput } from "@/lib/native/care-reminders";

const now = new Date(2026, 8, 26, 8, 0, 0, 0);

const luna: ReminderPetInput = {
  id: "pet-luna",
  name: "Luna",
  species: "dog",
  meals_per_day: 2,
};

const kiwi: ReminderPetInput = {
  id: "pet-kiwi",
  name: "Kiwi",
  species: "bird",
  meals_per_day: 2,
};

function foodTask(overrides: Partial<ReminderTaskInput> = {}): ReminderTaskInput {
  return {
    id: "task-breakfast",
    pet_id: luna.id,
    title: "Morning meal",
    category: "food",
    frequency: "daily",
    scheduled_time: "08:00",
    next_due_at: "2026-09-27T08:00:00.000Z",
    active: true,
    ...overrides,
  };
}

describe("care reminder planner", () => {
  it("schedules daily feed times from care tasks", () => {
    const reminders = buildCareReminders({
      pets: [luna],
      tasks: [foodTask(), foodTask({ id: "task-dinner", title: "Evening meal", scheduled_time: "18:00" })],
      now,
    });

    const meals = reminders.filter((item) => item.kind === "meal");
    expect(meals).toHaveLength(2);
    expect(meals.find((item) => item.body === "Morning meal")).toMatchObject({
      title: "Time to feed Luna",
      path: "/health/diet",
      hour: 8,
      minute: 0,
      repeat: "daily",
    });
    expect(meals.map((item) => `${item.hour}:${String(item.minute).padStart(2, "0")}`).sort()).toEqual([
      "18:00",
      "8:00",
    ]);
  });

  it("does not double-book a diet meal that matches a food task", () => {
    const reminders = buildCareReminders({
      pets: [luna],
      tasks: [foodTask()],
      meals: [{ pet_id: luna.id, label: "Meal 1", time: "08:00" }],
      now,
    });

    const meals = reminders.filter((item) => item.kind === "meal");
    expect(meals).toHaveLength(1);
    expect(meals[0]?.body).toBe("Morning meal");
  });

  it("fills missing meals from the diet plan and meals-per-day", () => {
    const fromPlan = buildCareReminders({
      pets: [luna],
      meals: mealsFromDietResult(luna.id, {
        mealSchedule: [
          { label: "Breakfast", time: "08:00" },
          { label: "Dinner", time: "18:00" },
        ],
      }),
      now,
    });
    expect(fromPlan.filter((item) => item.kind === "meal")).toHaveLength(2);

    const fromDefault = buildCareReminders({
      pets: [{ ...luna, meals_per_day: 3 }],
      now,
    });
    expect(fromDefault.filter((item) => item.kind === "meal").map((item) => item.hour).sort((a, b) => a - b)).toEqual([
      8,
      13,
      18,
    ]);
    expect(defaultMealTimes(2)).toEqual(["08:00", "18:00"]);
  });

  it("uses the weight care task instead of the fallback", () => {
    const reminders = buildCareReminders({
      pets: [luna],
      tasks: [
        {
          id: "task-weight",
          pet_id: luna.id,
          title: "Weight check for Luna",
          category: "weight",
          frequency: "monthly",
          scheduled_time: "10:00",
          next_due_at: "2026-10-03T10:00:00.000",
          active: true,
        },
      ],
      now,
    });

    const weights = reminders.filter((item) => item.kind === "weight");
    expect(weights).toHaveLength(1);
    expect(weights[0]).toMatchObject({
      title: "Time to weigh Luna",
      path: "/health/weight",
      repeat: "monthly",
      hour: 10,
    });
  });

  it("falls back to a weekly mammal and daily bird weight check", () => {
    const reminders = buildCareReminders({
      pets: [luna, kiwi],
      now,
    });
    const lunaWeight = reminders.find((item) => item.kind === "weight" && item.petId === luna.id);
    const kiwiWeight = reminders.find((item) => item.kind === "weight" && item.petId === kiwi.id);
    expect(lunaWeight).toMatchObject({ repeat: "weekly", weekday: 1, hour: 10, path: "/health/weight" });
    expect(kiwiWeight).toMatchObject({ repeat: "daily", hour: 8, path: "/health/weight" });
  });

  it("schedules vaccine day-before and day-of reminders", () => {
    const reminders = buildCareReminders({
      pets: [luna],
      vaccines: [
        {
          id: "vax-1",
          pet_id: luna.id,
          name: "Rabies",
          next_due_date: "2026-09-27",
          status: "upcoming",
        },
      ],
      now,
    });
    const vaccines = reminders.filter((item) => item.kind === "vaccine");
    expect(vaccines.map((item) => item.title)).toEqual([
      "Luna's Rabies is due tomorrow",
      "Luna's Rabies is due today",
    ]);
    expect(vaccines.every((item) => item.path === "/health/vaccinations")).toBe(true);
  });

  it("skips completed vaccines and respects preference toggles", () => {
    const reminders = buildCareReminders({
      pets: [luna],
      tasks: [foodTask()],
      vaccines: [{ id: "vax-2", pet_id: luna.id, name: "Distemper", next_due_date: "2026-10-01", status: "completed" }],
      prefs: { care_reminders: false, vaccination_alerts: true },
      now,
    });
    expect(reminders.filter((item) => item.kind === "meal")).toHaveLength(0);
    expect(reminders.filter((item) => item.kind === "vaccine")).toHaveLength(0);
  });

  it("uses medication tasks and otherwise parses dose frequency", () => {
    const fromTask = buildCareReminders({
      pets: [luna],
      tasks: [
        {
          id: "task-med",
          pet_id: luna.id,
          title: "Give Apoquel (morning)",
          category: "medication",
          frequency: "daily",
          scheduled_time: "08:00",
          next_due_at: null,
          active: true,
        },
      ],
      medications: [
        {
          id: "med-1",
          pet_id: luna.id,
          name: "Apoquel",
          dose: "16",
          unit: "mg",
          frequency: "twice daily",
          status: "active",
          end_date: null,
        },
      ],
      now,
    });
    expect(fromTask.filter((item) => item.kind === "medication")).toHaveLength(1);
    expect(fromTask.find((item) => item.kind === "medication")?.body).toBe("Give Apoquel (morning)");

    const fromRecord = buildCareReminders({
      pets: [luna],
      medications: [
        {
          id: "med-2",
          pet_id: luna.id,
          name: "Gabapentin",
          dose: "100",
          unit: "mg",
          frequency: "twice daily",
          status: "active",
          end_date: null,
        },
      ],
      now,
    });
    expect(
      fromRecord.filter((item) => item.kind === "medication").map((item) => item.hour).sort((a, b) => a - b)
    ).toEqual([8, 20]);
    expect(medicationTimes("three times a day")).toEqual(["08:00", "14:00", "20:00"]);
    expect(medicationTimes("daily")).toEqual(["09:00"]);
  });

  it("assigns stable ids and caps the schedule", () => {
    expect(reminderNotificationId("task:abc")).toBe(reminderNotificationId("task:abc"));
    expect(reminderNotificationId("task:abc")).not.toBe(reminderNotificationId("task:xyz"));

    const reminders = buildCareReminders({
      pets: [luna],
      tasks: Array.from({ length: 80 }, (_, index) =>
        foodTask({
          id: `task-${index}`,
          title: `Meal ${index}`,
          scheduled_time: `${String(index % 12).padStart(2, "0")}:00`,
        })
      ),
      now,
      limit: 10,
    });
    expect(reminders).toHaveLength(10);
    expect(new Set(reminders.map((item) => item.id)).size).toBe(10);
  });

  it("formats upcoming reminder labels", () => {
    const [meal] = buildCareReminders({
      pets: [luna],
      tasks: [foodTask()],
      prefs: { weight_suggestions: false },
      now,
    });
    expect(formatReminderWhen(meal!)).toBe("Every day · 8:00 AM");
  });
});
