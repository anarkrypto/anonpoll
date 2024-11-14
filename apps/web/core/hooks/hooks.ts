import { useEffect, useState } from "react";
import { TransactionReceipt } from "../controllers/wallet-controller";
import { useZeroPollContext } from "../context-provider";

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
