import { useCallback, useEffect, useState } from "react";
import { ChainState } from "./controllers/chain-controller";
import { WalletState } from "./controllers/wallet-controller";
import { PollState } from "./controllers/poll-controller";
import { PendingTransaction } from "@proto-kit/sequencer";
import { CreatePollData } from "./controllers/poll-manager-controller";
import { useZeroPollContext } from "./context-provider";

export const useChain = (): ChainState => {
  return useZeroPollContext().chainState;
};

export const useWallet = (): WalletState => {
  return useZeroPollContext().walletState;
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

export const useCreatePoll = () => {
  const [data, setData] = useState<{ id: number; hash: string } | null>(null);

  const {
    engine: {
      context: { pollManager },
    },
  } = useZeroPollContext();

  const createPoll = useCallback(
    async (data: CreatePollData) => {
      const result = await pollManager.create(data);
      setData(result);
    },
    [pollManager.create],
  );

  return { createPoll, data };
};
