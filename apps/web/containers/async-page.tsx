"use client";

import { Poll } from "@/components/poll";
import { usePoll } from "@/lib/stores/poll";
import { useWalletStore } from "@/lib/stores/wallet";

export default function Home() {
  const wallet = useWalletStore();

  const { vote, votes, loading } = usePoll();

  return (
    <div className="flex flex-col flex-1 justify-center items-center p-4 md:p-8">
      <Poll
        wallet={wallet.wallet}
        onConnectWallet={wallet.connectWallet}
        onVote={vote}
        loading={loading}
        votes={votes}
      />
    </div>
  );
}
