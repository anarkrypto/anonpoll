import { useState, useCallback, useEffect } from "react";
import { PendingTransaction } from "@proto-kit/sequencer";
import { useZeroPollContext } from "../context-provider";

export interface UseVoteParams {
  pollId: number;
  callbacks?: {
    onError?: (message: string) => void;
    onSuccess?: (result: { hash: string }) => void;
  };
}

export interface UseVoteReturn {
  vote: (optionHash: string) => Promise<void>;
  isPending: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  data: { hash: string } | null;
}

export const useVote = ({
  pollId,
  callbacks,
}: UseVoteParams): UseVoteReturn => {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ hash: string } | null>(null);

  const { engine } = useZeroPollContext();

  useEffect(() => {
    // Preload the poll
    engine.context.poll.loadPoll(pollId);
  }, [pollId]);

  const vote = useCallback(
    async (optionHash: string) => {
      setIsPending(true);
      setError(null);
      setData(null);

      try {
        // Ensure poll is loaded
        await engine.context.poll.loadPoll(pollId);

        // Submit vote transaction
        const result = await engine.context.poll.vote(optionHash);

        setData(result);
        callbacks?.onSuccess?.(result);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to submit vote";
        setError(message);
        callbacks?.onError?.(message);
      } finally {
        setIsPending(false);
      }
    },
    [pollId, engine.context.poll, callbacks],
  );

  return {
    vote,
    isPending,
    isSuccess: !!data,
    isError: !!error,
    error,
    data,
  };
};
