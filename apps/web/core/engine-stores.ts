import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { Engine } from "@/core/engine";
import { WalletState } from "@/core/controllers/wallet-controller";
import { PollState } from "@/core/controllers/poll-controller";
import { PendingTransaction } from "@proto-kit/sequencer";
import { ChainState } from "@/core/controllers/chain-controller";
import {
  CreatePollData,
  PollManagerState,
} from "@/core/controllers/poll-manager-controller";

const useEngineStore = create<Engine, [["zustand/immer", never]]>(
  immer(() => new Engine()),
);

export const useChainStore = create<ChainState, [["zustand/immer", never]]>(
  immer((set) => {
    const engine = useEngineStore();
    engine.context.chain.subscribe((state) => set(state));
    return engine.context.chain.state;
  }),
);

export const useWalletStore = create<WalletState, [["zustand/immer", never]]>(
  immer((set) => {
    const engine = useEngineStore();
    engine.context.wallet.subscribe((state) => set(state));
    return engine.context.wallet.state;
  }),
);

export const usePollStore = create<
  {
    state: PollState;
    load: (id: number) => Promise<void>;
    vote: (id: number, optionHash: string) => Promise<PendingTransaction>;
  },
  [["zustand/immer", never]]
>(
  immer((set) => {
    const engine = useEngineStore();
    const poll = engine.context.poll;
    poll.subscribe((state) => set({ state }));
    return { state: poll.state, load: poll.loadPoll, vote: poll.vote };
  }),
);

export const usPollManager = () =>
  create<
    {
      state: PollManagerState;
      create: (data: CreatePollData) => Promise<{ id: number; hash: string }>;
    },
    [["zustand/immer", never]]
  >(
    immer((set) => {
      const engine = useEngineStore();
      const manager = engine.context.pollManager;
      manager.subscribe((state) => set({ state }));
      return { state: manager.state, create: manager.create };
    }),
  );
