"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { usePoll } from "@/lib/stores/poll";
import { useWalletStore } from "@/lib/stores/wallet";

export function PollCard({ pollId }: { pollId: number }) {
  const wallet = useWalletStore();
  const { vote, votes, loading } = usePoll(pollId);

  return (
    <Card className="w-full max-w-xl p-4">
      <CardHeader>
        <CardTitle>ZeroPoll</CardTitle>
        <CardDescription>
          A private voting system powered by zero-knowledge proofs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {wallet.wallet ? (
          <>
            <div className="flex items-center gap-2">
              <div className="w-12 rounded-md border px-2 py-1 text-center text-xl font-semibold">
                {votes.yayes.toString()}
              </div>
              <Button
                size="lg"
                className="w-full"
                loading={loading}
                onClick={() => vote(true)}
                variant="outline"
              >
                Vote True ✅
              </Button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-12 rounded-md border px-2 py-1 text-center text-xl font-semibold">
                {votes.nays.toString()}
              </div>
              <Button
                size="lg"
                className="w-full"
                loading={loading}
                onClick={() => vote(false)}
                variant="outline"
              >
                Vote False ❌
              </Button>
            </div>
          </>
        ) : (
          <Button
            size="lg"
            className="w-full"
            loading={loading}
            onClick={wallet.connectWallet}
          >
            Connect your Auro Wallet
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
