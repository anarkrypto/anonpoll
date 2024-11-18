"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Engine, EngineConfig } from "@/core/engine";
import { AuroWallet } from "./signers/auro-wallet";

type EngineContextValue = {
  engine: Engine;
  initialized: boolean;
};

const EngineContext = createContext({} as EngineContextValue);

export function EngineProvider({
  children,
  tickInterval,
  protokitGraphqlUrl,
  storeApiUrl,
}: { children: React.ReactNode } & EngineConfig) {
  const [initialized, setInitialized] = useState(false);

  const engine = useMemo(
    () => new Engine({ tickInterval, protokitGraphqlUrl, storeApiUrl }),
    [tickInterval, protokitGraphqlUrl, storeApiUrl],
  );

  const init = async () => {
    await engine.init();
    if (AuroWallet.isInstalled()) {
      const walletProvider = new AuroWallet();
      await engine.context.wallet.init(walletProvider);
    }
    setInitialized(true);
  };

  useEffect(() => {
    init();
  }, []);

  return (
    <EngineContext.Provider value={{ engine, initialized }}>
      {children}
    </EngineContext.Provider>
  );
}

export const useEngine = () => {
  return useContext(EngineContext);
};
