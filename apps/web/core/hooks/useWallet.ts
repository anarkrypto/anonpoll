import { WalletState } from "../controllers/wallet-controller";
import { useZeroPollContext } from "../context-provider";

export interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
}

export const useWallet = (): UseWalletReturn => {
  const { walletState, engine } = useZeroPollContext();
  return { ...walletState, connect: () => engine.context.wallet.connect() };
};
