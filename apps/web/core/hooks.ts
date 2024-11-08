import { useCallback, useEffect, useState } from "react";
import { ChainState } from "./controllers/chain-controller";
import { WalletState } from "./controllers/wallet-controller";
import { PollState } from "./controllers/poll-controller";
import { PendingTransaction } from "@proto-kit/sequencer";
import { CreatePollData } from "./controllers/poll-manager-controller";
import { useZeroPollContext } from "./context-provider";
import { AuthState } from "./controllers/auth-controller";

export const useChain = (): ChainState => {
  return useZeroPollContext().chainState;
};

export const useWallet = (): WalletState & { connect: () => Promise<void> } => {
  const { walletState, engine } = useZeroPollContext();
  return { ...walletState, connect: () => engine.context.wallet.connect() };
};

export const useAuth = (): AuthState & {
  authenticate: () => Promise<void>;
} => {
  const { authState, engine } = useZeroPollContext();
  return {
    ...authState,
    authenticate: () => engine.context.auth.authenticate(),
  };
};

export const usePoll = (
  id: number,
): PollState & {
  vote: (id: number, optionHash: string) => Promise<PendingTransaction>;
} => {
  const {
    engine: {
      context: { poll },
    },
    pollState,
  } = useZeroPollContext();

  useEffect(() => {
    poll.loadPoll(id);
  }, [id]);

  const vote = poll.vote;

  return { ...pollState, vote };
};

export const useCreatePoll = (callbacks?: {
  onError?: (message: string) => void;
  onSuccess?: (result: { id: number; hash: string }) => void;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ id: number; hash: string } | null>(null);

  const { engine } = useZeroPollContext();

  const createPoll = useCallback(
    async (data: CreatePollData) => {
      setLoading(true);
      try {
        const result = await engine.context.pollManager.create(data);
        setData(result);
        callbacks?.onSuccess?.(result);
      } catch (error) {
        console.error(error);
        const message = error instanceof Error ? error.message : "Unknown error";
        callbacks?.onError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [engine.context.pollManager.create],
  );

  return { createPoll, loading, data };
};
