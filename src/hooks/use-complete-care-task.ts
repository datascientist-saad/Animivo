"use client";

import { useCallback, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { toast } from "sonner";
import {
  optimisticTaskCompletion,
  removeTaskCompletion,
  replaceTaskCompletion,
} from "@/lib/care-completions";
import { toUserMessage } from "@/lib/errors";
import { CareTaskService } from "@/services/care-task-service";
import type { CareTask, TaskCompletion } from "@/types/database";

export function useCompleteCareTask({
  supabase,
  setCompletions,
  successMessage,
}: {
  supabase: SupabaseClient;
  setCompletions: Dispatch<SetStateAction<TaskCompletion[]>>;
  successMessage: string;
}) {
  const inFlight = useRef(new Set<string>());
  const [completingIds, setCompletingIds] = useState<Set<string>>(() => new Set());

  const completeTask = useCallback(
    async (task: CareTask) => {
      if (inFlight.current.has(task.id)) return;
      inFlight.current.add(task.id);
      setCompletingIds(new Set(inFlight.current));

      const optimistic = optimisticTaskCompletion(task.id, task.pet_id);
      setCompletions((current) => replaceTaskCompletion(current, optimistic));

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) throw new Error("Please sign in.");
        const completion = await new CareTaskService(supabase).complete(task, user.id);
        setCompletions((current) => replaceTaskCompletion(current, completion, optimistic.id));
        toast.success(successMessage);
      } catch (err) {
        setCompletions((current) => removeTaskCompletion(current, optimistic.id));
        toast.error(toUserMessage(err));
      } finally {
        inFlight.current.delete(task.id);
        setCompletingIds(new Set(inFlight.current));
      }
    },
    [setCompletions, successMessage, supabase]
  );

  return { completeTask, completingIds };
}
