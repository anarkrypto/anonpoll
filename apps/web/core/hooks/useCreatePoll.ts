import { useState, useCallback } from "react";
import { useZeroPollContext } from "../context-provider";
import { CreatePollData } from "../controllers/poll-manager-controller";

export interface CreatePollResult {
  id: number;
  hash: string;
}

export interface UseCreatePollOptions {
  onError?: (message: string) => void;
  onSuccess?: (result: CreatePollResult) => void;
}

export interface UseCreatePollReturn {
  createPoll: (data: CreatePollData) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: CreatePollResult | null;
  reset: () => void;
}

export const useCreatePoll = (
  options: UseCreatePollOptions = {},
): UseCreatePollReturn => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CreatePollResult | null>(null);

  const { engine } = useZeroPollContext();

  const reset = useCallback(() => {
    setIsPending(false);
    setError(null);
    setData(null);
  }, []);

  const createPoll = useCallback(
    async (pollData: CreatePollData) => {
      setIsPending(true);
      setError(null);
      setData(null);

      try {
        const result = await engine.context.pollManager.create(pollData);
        setData(result);
        options.onSuccess?.(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        options.onError?.(message);
        console.error(err);
      } finally {
        setIsPending(false);
      }
    },
    [engine.context.pollManager.create, options],
  );

  // Derive boolean flags from state
  const isError = !!error;
  const isSuccess = !isPending && !error && !!data;

  return {
    createPoll,
    isPending,
    isSuccess,
    isError,
    error,
    data,
    reset,
  };
};
