"use client";

import { Poll } from "@/components/poll";
import { usePoll } from "@/lib/stores/poll";
import { useWalletStore } from "@/lib/stores/wallet";

export default function Home() {
  const wallet = useWalletStore();

  const { vote, votes, loading } = usePoll();

  return (
    <div className="mx-auto -mt-32 h-full pt-16">
      <div className="flex h-full w-full items-center justify-center pt-16">
        <div className="flex basis-4/12 flex-col items-center justify-center 2xl:basis-3/12">
          <Poll
            wallet={wallet.wallet}
            onConnectWallet={wallet.connectWallet}
            onVote={vote}
            loading={loading}
            votes={votes}
          />
        </div>
      </div>
    </div>
  );
}
