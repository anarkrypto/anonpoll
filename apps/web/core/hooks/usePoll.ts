import { useState, useCallback, useEffect } from "react";
import { useZeroPollContext } from "../context-provider";
import { PollState } from "../controllers/poll-controller";

interface UsePollReturn {
  data: Omit<PollState, "loading">;
  isLoading: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePoll = (id: number): UsePollReturn => {
  const { engine, pollState } = useZeroPollContext();
  const [error, setError] = useState<string | null>(null);

  const loadPoll = useCallback(async () => {
    setError(null);
    try {
      await engine.context.poll.loadPoll(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load poll";
      setError(message);
    }
  }, [id, engine.context.poll]);

  useEffect(() => {
    loadPoll();
  }, [id]);

  return {
    data: {
      metadata: pollState.metadata,
      options: pollState.options,
      commitment: pollState.commitment,
    },
    isLoading: pollState.loading,
    isSuccess: pollState.metadata !== null,
    isError: !!error,
    error,
    refetch: loadPoll,
  };
};
