import { useState, useCallback, useEffect } from "react";
import { useControllers } from "./useControllers";
import { useEngine } from "../engine-context";

export interface UseVoteOptions {
  onError?: (message: string) => void;
  onSuccess?: (result: { hash: string }) => void;
}

export interface UseVoteReturn {
  vote: (optionHash: string) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: { hash: string } | null;
}

export const useVote = (
  pollCid: string,
  options?: UseVoteOptions,
): UseVoteReturn => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ hash: string } | null>(null);
  const { poll: pollController } = useControllers();
  const { initialized } = useEngine();

  useEffect(() => {
    // Preload the poll
    if (initialized) {
      pollController.loadPoll(pollCid);
    }
  }, [pollCid, pollController, initialized]);

  const vote = useCallback(
    async (optionHash: string) => {
      setIsPending(true);
      setError(null);
      setData(null);
      try {
        const result = await pollController.vote(optionHash);
        setData(result);
        options?.onSuccess?.(result);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(message);
        options?.onError?.(message);
      } finally {
        setIsPending(false);
      }
    },
    [pollController, options],
  );

  return {
    vote,
    isPending,
    isSuccess: !isPending && !error && !!data,
    isError: !!error,
    error,
    data,
  };
};
