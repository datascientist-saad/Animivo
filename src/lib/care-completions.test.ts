import { describe, expect, it } from "vitest";
import { getTodaysCareTasks } from "@/lib/calculations";
import {
  optimisticTaskCompletion,
  removeTaskCompletion,
  replaceTaskCompletion,
} from "@/lib/care-completions";
import type { CareTask, TaskCompletion } from "@/types/database";

const task = {
  id: "task-1",
  pet_id: "pet-1",
  active: true,
  frequency: "daily",
  next_due_at: "2026-09-08T08:00:00.000Z",
  scheduled_time: "08:00",
  title: "Morning meal",
} as CareTask;

describe("care completion local updates", () => {
  it("marks a today's task complete when a completion is appended", () => {
    const now = new Date("2026-09-08T12:00:00");
    const before = getTodaysCareTasks([task], [], now);
    expect(before[0]?.completed).toBe(false);

    const completion: TaskCompletion = {
      id: "done-1",
      care_task_id: "task-1",
      pet_id: "pet-1",
      completed_at: "2026-09-08T12:05:00.000Z",
      completed_by: "user-1",
      notes: null,
    };

    const after = getTodaysCareTasks([task], [completion], now);
    expect(after[0]?.completed).toBe(true);
    expect(after[0]?.completion?.id).toBe("done-1");
  });

  it("replaces an optimistic completion without duplicating it", () => {
    const optimistic = optimisticTaskCompletion("task-1", "pet-1");
    const saved: TaskCompletion = {
      ...optimistic,
      id: "saved-1",
      completed_by: "user-1",
    };
    const next = replaceTaskCompletion([optimistic], saved, optimistic.id);
    expect(next).toHaveLength(1);
    expect(next[0]?.id).toBe("saved-1");
  });

  it("rolls back an optimistic completion on failure", () => {
    const optimistic = optimisticTaskCompletion("task-1", "pet-1");
    expect(removeTaskCompletion([optimistic], optimistic.id)).toEqual([]);
  });
});
