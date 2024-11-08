import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Engine, EngineConfig } from "@/core/engine";
import { WalletState } from "@/core/controllers/wallet-controller";
import { PollState } from "@/core/controllers/poll-controller";
import { ChainState } from "@/core/controllers/chain-controller";
import { PollManagerState } from "@/core/controllers/poll-manager-controller";
import { AuroWalletProvider } from "./providers/wallets/auro-wallet-provider";
import { AuthState } from "./controllers/auth-controller";

type ZeroPollContextValue = {
  engine: Engine;
  chainState: ChainState;
  walletState: WalletState;
  authState: AuthState;
  pollState: PollState;
  pollManagerState: PollManagerState;
};

const ZeroPollContext = createContext({} as ZeroPollContextValue);

export const useZeroPollContext = () => {
  return useContext(ZeroPollContext);
};

export function ZeroPollProvider({
  children,
  tickInterval,
  protokitGraphqlUrl,
  storeApiUrl,
}: { children: React.ReactNode } & EngineConfig) {
  const engine = useMemo(
    () => new Engine({ tickInterval, protokitGraphqlUrl, storeApiUrl }),
    [tickInterval, protokitGraphqlUrl, storeApiUrl],
  );

  const [chainState, setChainState] = useState<ChainState>(
    engine.context.chain.state,
  );
  const [walletState, setWalletState] = useState<WalletState>(
    engine.context.wallet.state,
  );
  const [authState, setAuthState] = useState<AuthState>(
    engine.context.auth.state,
  );
  const [pollState, setPollState] = useState<PollState>(
    engine.context.poll.state,
  );
  const [pollManagerState, setPollManagerState] = useState<PollManagerState>(
    engine.context.pollManager.state,
  );

  useEffect(() => {
    engine.context.chain.start();
    const walletProvider = new AuroWalletProvider();
    engine.context.wallet.init(walletProvider);
    engine.context.auth.init();

    // Subscribe to sync states
    engine.context.chain.subscribe(setChainState);
    engine.context.wallet.subscribe(setWalletState);
    engine.context.auth.subscribe(setAuthState);
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
        authState,
        pollState,
        pollManagerState,
      }}
    >
      {children}
    </ZeroPollContext.Provider>
  );
}
