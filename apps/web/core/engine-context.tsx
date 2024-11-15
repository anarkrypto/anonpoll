import React, { createContext, useContext, useEffect, useMemo } from "react";
import { Engine, EngineConfig } from "@/core/engine";
import { AuroWalletProvider } from "./providers/wallets/auro-wallet-provider";

type EngineContextValue = {
  engine: Engine;
};

const EngineContext = createContext({} as EngineContextValue);

export function EngineProvider({
  children,
  tickInterval,
  protokitGraphqlUrl,
  storeApiUrl,
}: { children: React.ReactNode } & EngineConfig) {
  const engine = useMemo(
    () => new Engine({ tickInterval, protokitGraphqlUrl, storeApiUrl }),
    [tickInterval, protokitGraphqlUrl, storeApiUrl],
  );

  useEffect(() => {
    engine.init();
    if (AuroWalletProvider.isInstalled()) {
      const walletProvider = new AuroWalletProvider();
      engine.context.wallet.init(walletProvider);
    }
  }, []);

  return (
    <EngineContext.Provider value={{ engine }}>
      {children}
    </EngineContext.Provider>
  );
}

export const useEngine = () => {
  return useContext(EngineContext);
};
