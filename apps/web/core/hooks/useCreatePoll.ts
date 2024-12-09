import { useState, useCallback } from "react";
import { CreatePollData } from "../controllers/poll-manager-controller";
import { useControllers } from "./useControllers";

export interface CreatePollResult {
  cid: string;
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
}

export const useCreatePoll = (
  options: UseCreatePollOptions = {},
): UseCreatePollReturn => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CreatePollResult | null>(null);
  const { pollManager: pollManagerController } = useControllers();

  const createPoll = useCallback(
    async (pollData: CreatePollData) => {
      setIsPending(true);
      setError(null);
      setData(null);
      try {
        const result = await pollManagerController.create(pollData);
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
    [pollManagerController, options],
  );

  return {
    createPoll,
    isPending,
    isSuccess: !isPending && !error && !!data,
    isError: !!error,
    error,
    data,
  };
};