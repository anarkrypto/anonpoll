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
  loading: boolean;
  error: string | null;
  data: { hash: string } | null;
}

export const useVote = ({
  pollId,
  callbacks,
}: UseVoteParams): UseVoteReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ hash: string } | null>(null);

  const { engine } = useZeroPollContext();

  useEffect(() => {
    // Preload the poll
    engine.context.poll.loadPoll(pollId);
  }, [pollId]);

  const vote = useCallback(
    async (optionHash: string) => {
      setLoading(true);
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
        setLoading(false);
      }
    },
    [pollId, engine.context.poll, callbacks],
  );

  return {
    vote,
    loading,
    error,
    data,
  };
};
