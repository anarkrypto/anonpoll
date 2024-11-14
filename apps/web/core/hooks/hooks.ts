import { useEffect, useState } from "react";
import {
  TransactionReceipt,
  WalletState,
} from "../controllers/wallet-controller";
import { useZeroPollContext } from "../context-provider";
import { AuthState } from "../controllers/auth-controller";

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
