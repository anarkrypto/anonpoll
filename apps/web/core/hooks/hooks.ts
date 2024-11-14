import { useCallback, useEffect, useState } from "react";
import { ChainState } from "../controllers/chain-controller";
import {
  TransactionReceipt,
  WalletState,
} from "../controllers/wallet-controller";
import { PollState } from "../controllers/poll-controller";
import { PendingTransaction } from "@proto-kit/sequencer";
import { CreatePollData } from "../controllers/poll-manager-controller";
import { useZeroPollContext } from "../context-provider";
import { AuthState } from "../controllers/auth-controller";

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

export const usePoll = (id: number): PollState => {
  const { engine, pollState } = useZeroPollContext();

  useEffect(() => {
    engine.context.poll.loadPoll(id);
  }, [id]);

  return { ...pollState };
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
        const message =
          error instanceof Error ? error.message : "Unknown error";
        callbacks?.onError?.(message);
      } finally {
        setLoading(false);
      }
    },
    [engine.context.pollManager.create],
  );

  return { createPoll, loading, data };
};

export const useWaitForTransactionReceipt = ({
  hash,
}: {
  hash?: string | null;
}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<TransactionReceipt | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { engine } = useZeroPollContext();
  useEffect(() => {
    if (!hash) {
      setLoading(false);
      setData(null);
      setError(null);
      return;
    }
    setLoading(true);
    engine.context.wallet
      .waitForTransactionReceipt(hash)
      .then((result) => {
        setData(result);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, [engine.context.wallet.waitForTransactionReceipt, hash]);
  return { loading, data, error };
};
