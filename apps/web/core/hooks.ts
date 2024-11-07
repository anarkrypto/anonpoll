import { useCallback, useEffect, useState } from "react";
import { ChainState } from "./controllers/chain-controller";
import { WalletState } from "./controllers/wallet-controller";
import {
  useChainStore,
  usePollManagerStore,
  usePollStore,
  useWalletStore,
} from "./engine-stores";
import { PollState } from "./controllers/poll-controller";
import { PendingTransaction } from "@proto-kit/sequencer";
import { CreatePollData } from "./controllers/poll-manager-controller";

export const useChain = (): ChainState => {
  return useChainStore();
};

export const useWallet = (): WalletState => {
  return useWalletStore();
};

export const usePoll = (
  id: number,
): PollState & {
  vote: (id: number, optionHash: string) => Promise<PendingTransaction>;
} => {
  useEffect(() => {
    load(id);
  }, [id]);

  const { state, load, vote } = usePollStore();
  return { ...state, vote };
};

export const useCreatePoll = () => {
  const [data, setData] = useState<{ id: number; hash: string } | null>(null);

  const create = usePollManagerStore((state) => state.create);

  const createPoll = useCallback(
    async (data: CreatePollData) => {
      const result = await create(data);
      setData(result);
    },
    [create],
  );

  return { createPoll, data };
};
