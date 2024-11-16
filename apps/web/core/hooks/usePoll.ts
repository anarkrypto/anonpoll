import { useState, useCallback, useEffect, useSyncExternalStore } from "react";
import { PollState } from "../controllers/poll-controller";
import { useEngine } from "../engine-context";

export interface UsePollReturn {
  data: Omit<PollState, "loading">;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePoll = (id: number): UsePollReturn => {
  const { engine, initialized } = useEngine();
  const pollController = engine.context.poll;

  const [error, setError] = useState<string | null>(null);

  const pollState = useSyncExternalStore(
    (callback) => pollController.subscribe(callback),
    () => pollController.state,
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
    if (initialized) loadPoll();
  }, [id, loadPoll, initialized]);

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
