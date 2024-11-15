import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { useControllers } from "./useControllers";
import { PollState } from "../controllers/poll-controller";

export interface UsePollReturn {
  data: Omit<PollState, "loading">;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePoll = (id: number): UsePollReturn => {
  const { poll: pollController } = useControllers();
  const [error, setError] = useState<string | null>(null);

  const pollState = useSyncExternalStore(
    pollController.subscribe,
    () => pollController.state
  );

  const loadPoll = useCallback(async () => {
    setError(null);
    try {
      await pollController.loadPoll(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load poll";
      setError(message);
    }
  }, [id, pollController]);

  useEffect(() => {
    loadPoll();
  }, [id, loadPoll]);

  return {
    data: {
      metadata: pollState.metadata,
      options: pollState.options,
      commitment: pollState.commitment,
    },
    isLoading: pollState.loading,
    isSuccess: !pollState.loading && !error,
    isError: !!error,
    error,
    refetch: loadPoll,
  };
};