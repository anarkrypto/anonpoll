"use client";

import "reflect-metadata";

import { Poll } from "@/components/poll";
import { useObservePoll, usePoll } from "@/lib/stores/poll";
import { useWalletStore } from "@/lib/stores/wallet";

export default function Home({ params }: { params: { pollId: string } }) {
  const wallet = useWalletStore();

  // TODO: add extra validation for pollId
  const pollId = Number(params.pollId);

  useObservePoll(pollId);
  const { vote, votes, loading } = usePoll(pollId);

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
