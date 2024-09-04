"use client";

import "reflect-metadata";

import { Poll } from "@/components/poll";
import { useObservePoll, usePoll } from "@/lib/stores/poll";
import { useWalletStore } from "@/lib/stores/wallet";

export default function Home() {
  const wallet = useWalletStore();

  useObservePoll(1);
  const { vote, votes, loading } = usePoll(1);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
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
