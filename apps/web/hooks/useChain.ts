import { useBalancesStore } from "@/lib/stores/balances";
import { useChainStore } from "@/lib/stores/chain";
import { useClientStore } from "@/lib/stores/client";
import { useWalletStore } from "@/lib/stores/wallet";

export const useChain = () => {
  const wallet = useWalletStore();
  const client = useClientStore();
  const chain = useChainStore();
  const balances = useBalancesStore();

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
