import React, { createContext, useContext, useEffect, useState } from "react";
import { Engine } from "@/core/engine";
import { WalletState } from "@/core/controllers/wallet-controller";
import { PollState } from "@/core/controllers/poll-controller";
import { ChainState } from "@/core/controllers/chain-controller";
import { PollManagerState } from "@/core/controllers/poll-manager-controller";

type ZeroPollContextValue = {
  engine: Engine;
  chainState: ChainState;
  walletState: WalletState;
  pollState: PollState;
  pollManagerState: PollManagerState;
};

const ZeroPollContext = createContext({} as ZeroPollContextValue);

export const useZeroPollContext = () => {
  return useContext(ZeroPollContext);
};

const engine = new Engine();

export function ZeroPollProvider({ children }: { children: React.ReactNode }) {
  const [chainState, setChainState] = useState<ChainState>(
    engine.context.chain.state,
  );
  const [walletState, setWalletState] = useState<WalletState>(
    engine.context.wallet.state,
  );
  const [pollState, setPollState] = useState<PollState>(
    engine.context.poll.state,
  );
  const [pollManagerState, setPollManagerState] = useState<PollManagerState>(
    engine.context.pollManager.state,
  );

  console.log("here");

  useEffect(() => {
    engine.context.chain.start();

    // Subscribe to sync states
    engine.context.chain.subscribe(setChainState);
    engine.context.wallet.subscribe(setWalletState);
    engine.context.poll.subscribe(setPollState);
    engine.context.pollManager.subscribe(setPollManagerState);
    setPollManagerState(engine.context.pollManager.state);

    // Cleanup subscriptions on unmount
    return () => {
      engine.context.chain.unsubscribe(setChainState);
      engine.context.wallet.unsubscribe(setWalletState);
      engine.context.poll.unsubscribe(setPollState);
      engine.context.pollManager.unsubscribe(setPollManagerState);
    };
  }, []);

  return (
    <ZeroPollContext.Provider
      value={{
        engine,
        chainState,
        walletState,
        pollState,
        pollManagerState,
      }}
    >
      {children}
    </ZeroPollContext.Provider>
  );
}
