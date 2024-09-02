"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";

export interface PollProps {
  wallet?: string;
  loading: boolean;
  votes: { yayes: BigInt; nays: BigInt };
  onConnectWallet: () => void;
  onVote: (bool: boolean) => void;
}

export function Poll({
  wallet,
  onConnectWallet,
  onVote,
  votes,
  loading,
}: PollProps) {
  return (
    <Card className="w-full p-4">
      <CardHeader>
        <CardTitle>ZeroPoll</CardTitle>
        <CardDescription>
          A private voting system powered by zero-knowledge proofs
        </CardDescription>
      </CardHeader>
      <CardContent>
        {wallet ? (
          <>
            <div className="flex items-center gap-2">
              <div className="rounded-md font-semibold border px-2 py-1 text-xl">
                {votes.yayes.toString()}
              </div>
              <Button
                size="lg"
                className="w-full"
                loading={loading}
                onClick={() => onVote(true)}
              >
                Vote True ✅
              </Button>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <div className="rounded-md font-semibold border px-2 py-1 text-xl">
                {votes.nays.toString()}
              </div>
              <Button
                size="lg"
                className="w-full"
                loading={loading}
                onClick={() => onVote(false)}
              >
                Vote False ❌
              </Button>
            </div>
          </>
        ) : (
          <Button
            size="lg"
            className="mt-6 w-full"
            loading={loading}
            onClick={onConnectWallet}
          >
            Connect your Auro Wallet
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
