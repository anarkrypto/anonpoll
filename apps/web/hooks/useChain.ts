import { useBalancesStore, useObserveBalance } from "@/lib/stores/balances";
import { useChainStore, usePollBlockHeight } from "@/lib/stores/chain";
import { useClientStore } from "@/lib/stores/client";
import { useNotifyTransactions, useWalletStore } from "@/lib/stores/wallet";

export const useChain = () => {
  const wallet = useWalletStore();
  const client = useClientStore();
  const chain = useChainStore();
  const balances = useBalancesStore();

  usePollBlockHeight();
  useObserveBalance();
  useNotifyTransactions();

  const init = async () => {
    client.start();
    wallet.initializeWallet();
    wallet.observeWalletChange();
  };

  return {
    init,
    chain,
    balances,
    client,
    wallet,
  };
};
