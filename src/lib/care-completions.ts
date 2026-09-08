import type { TaskCompletion } from "@/types/database";

export function replaceTaskCompletion(
  completions: TaskCompletion[],
  completion: TaskCompletion,
  replaceId?: string
): TaskCompletion[] {
  return [
    completion,
    ...completions.filter((item) => item.id !== completion.id && item.id !== replaceId),
  ];
}

export function removeTaskCompletion(completions: TaskCompletion[], completionId: string): TaskCompletion[] {
  return completions.filter((item) => item.id !== completionId);
}

export function optimisticTaskCompletion(taskId: string, petId: string): TaskCompletion {
  return {
    id: `optimistic-${taskId}`,
    care_task_id: taskId,
    pet_id: petId,
    completed_at: new Date().toISOString(),
    completed_by: null,
    notes: null,
  };
}
