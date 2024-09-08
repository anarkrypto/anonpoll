"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "./ui/button";
import { usePoll } from "@/lib/stores/poll";
import { useWalletStore } from "@/lib/stores/wallet";
import { PollData } from "@/types/poll";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogDescription, DialogProps } from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import { CircleCheckBigIcon, CircleIcon, ShieldCheckIcon } from "lucide-react";
import { generateCommitmentRoot } from "@/lib/utils";
import { OptionHash } from "chain/dist/runtime/modules/poll";
import { cn } from "@/lib/cn";

export function PollCard({
  id,
  title,
  description,
  options,
  votersWallets,
  salt,
  createdAt,
}: Omit<PollData, "creatorWallet">) {
  const [wallet, connectWallet] = useWalletStore((store) => [
    store.wallet,
    store.connectWallet,
  ]);
  const {
    vote,
    votes: votesMap,
    loading,
    commitment,
    voted,
    voting,
  } = usePoll(id);
  const [openVotersModal, setOpenVotersModal] = useState(false);
  const [activeOptionHash, setActiveOptionHash] = useState<string | null>(null);
  const [loadProgressBar, setLoadProgressBar] = useState(false);

  const validProof = useMemo(() => {
    if (!commitment) return false;
    return commitment === generateCommitmentRoot(votersWallets).toString();
  }, [votersWallets, commitment]);

  const optionsVotes = useMemo(() => {
    return options.map((option) => {
      const hash = OptionHash.fromText(option, salt).toString();
      const votesCount =
        votesMap.find((vote) => vote.hash === hash)?.votesCount || 0;
      const votesPercentage = (votesCount / votersWallets.length) * 100;
      return {
        text: option,
        hash,
        votesCount,
        votesPercentage,
      };
    });
  }, [votesMap, options, salt]);

  const winnerOptionHash = useMemo(() => {
    // Return winner option hash.
    // If there is no vote, return null.
    // If there is a tie, return null.
    if (optionsVotes.every((option) => option.votesCount === 0)) {
      return null;
    }
    const maxVotesCount = Math.max(
      ...optionsVotes.map((option) => option.votesCount),
    );
    const topOptions = optionsVotes.filter(
      (option) => option.votesCount === maxVotesCount,
    );
    if (topOptions.length > 1) {
      return null;
    }
    return topOptions[0]?.hash || null;
  }, [optionsVotes]);

  const handleVote = () => {
    if (!activeOptionHash) return;
    vote(votersWallets, activeOptionHash, salt);
  };

  const handleSelectOption = (hash: string) => {
    if (voted) return;
    setActiveOptionHash((prev) => (prev === hash ? null : hash));
  };

  const canVote = !!activeOptionHash && validProof;

  useEffect(() => {
    if (loading || loadProgressBar) return;
    const timeout = setTimeout(() => {
      setLoadProgressBar(true);
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [loading, loadProgressBar]);

  return (
    <>
      <Card className="w-full max-w-xl p-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {optionsVotes.map((option, index) => (
                <li key={index}>
                  <Button
                    size="lg"
                    className={cn(
                      "relative w-full px-12",
                      activeOptionHash === option.hash &&
                        "border-2 border-primary/40 bg-primary/20 hover:bg-primary/20 ",
                    )}
                    loading={loading}
                    onClick={() => handleSelectOption(option.hash)}
                    variant="outline"
                  >
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 h-full rounded-md bg-green-400/30 transition-all duration-500 ease-in-out",
                        activeOptionHash === option.hash && "bg-primary/30",
                      )}
                      style={{
                        width: loadProgressBar
                          ? `${option.votesPercentage * 0.6}%`
                          : option.votesPercentage * 0.2,
                      }}
                    />
                    <div className="absolute left-2 top-1/2 mr-2 -translate-y-1/2">
                      {activeOptionHash === option.hash ? (
                        <CircleCheckBigIcon className="h-5 w-5 text-primary" />
                      ) : (
                        <CircleIcon className="h-5 w-5 text-zinc-400" />
                      )}
                    </div>
                    <div className="flex flex-1 justify-start">
                      {option.text}
                    </div>
                    <div
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2",
                        winnerOptionHash === option.hash &&
                          "font-bold text-green-600",
                      )}
                    >
                      {option.votesPercentage}%
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
            {!!wallet && !voted && (
              <Button
                size="lg"
                className="w-full"
                type="submit"
                onClick={handleVote}
                disabled={!canVote}
                loading={voting}
              >
                Vote
              </Button>
            )}
            {!wallet && (
              <Button
                size="lg"
                className="w-full"
                loading={loading}
                onClick={connectWallet}
              >
                Connect your Auro Wallet
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter>
          {votersWallets.length > 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="w-12 rounded-md border px-2 py-1 text-center text-xl font-semibold">
                {votersWallets.length.toString()}
              </div>
              <Button
                size="lg"
                className="w-full"
                loading={loading}
                onClick={() => setOpenVotersModal(true)}
                variant="outline"
              >
                View Elegible Voters ({validProof ? "Valid" : "Invalid"})
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
      <VotersModal
        votersWallets={votersWallets}
        open={openVotersModal}
        onOpenChange={setOpenVotersModal}
        validProof={validProof}
      />
    </>
  );
}

function VotersModal({
  votersWallets,
  validProof,
  ...props
}: DialogProps & { votersWallets: string[]; validProof: boolean }) {
  return (
    <Dialog modal {...props}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Elegible Voters Wallets</DialogTitle>
          <DialogDescription>
            View the wallets that are elegible to vote in this poll. Remember
            the votes itself are private.
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-between">
          <div className="font-semibold">
            Total Wallets: {votersWallets.length}
          </div>
          {validProof ? (
            <div className="flex items-center gap-1 font-semibold text-green-700">
              <ShieldCheckIcon className="h-5 w-5" />
              Valid Proofs
            </div>
          ) : (
            <div className="flex items-center gap-1 font-semibold text-red-700">
              <ShieldCheckIcon className="h-5 w-5" />
              Invalid Proofs
            </div>
          )}
        </div>
        <ul className="flex list-disc flex-col gap-2 pl-4">
          {votersWallets.map((wallet, i) => (
            <li key={i} className="flex-1 break-words break-all text-sm">
              {wallet}
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
