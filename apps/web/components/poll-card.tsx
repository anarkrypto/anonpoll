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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { DialogDescription, DialogProps } from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState } from "react";
import {
  CircleCheckBigIcon,
  CircleIcon,
  Share2Icon,
  ShieldCheckIcon,
} from "lucide-react";
import { generateCommitmentRoot } from "@/lib/utils";
import { cn } from "@/lib/cn";
import { Badge } from "./ui/badge";
import { useToast } from "./ui/use-toast";
import { usePoll, useVote, useWallet } from "@/core/hooks";
import { PollCardSkeleton } from "./poll-card-skeleton";
import { PollCardError } from "./poll-card-error";

export function PollCard({ id }: { id: number }) {
  const { account, connect } = useWallet();
  const {
    data: { metadata, options, commitment },
    isLoading,
    error,
  } = usePoll(id);

  const { vote, isPending: isVoting, isSuccess: isVoted } = useVote(id);

  const [openVotersModal, setOpenVotersModal] = useState(false);
  const [activeOptionHash, setActiveOptionHash] = useState<string | null>(null);
  const [loadProgressBar, setLoadProgressBar] = useState(false);
  const { toast } = useToast();

  const validProof = useMemo(() => {
    if (!commitment || !metadata?.votersWallets) return false;
    return (
      commitment === generateCommitmentRoot(metadata.votersWallets).toString()
    );
  }, [metadata?.votersWallets, commitment]);

  const winnerOption = useMemo(() => {
    // Return winner option hash.
    // If there is no vote, return null.
    // If there is a tie, return null.
    if (options.every((option) => option.votesCount === 0)) {
      return null;
    }
    const maxVotesCount = Math.max(
      ...options.map((option) => option.votesCount),
    );
    const topOptions = options.filter(
      (option) => option.votesCount === maxVotesCount,
    );
    if (topOptions.length > 1) {
      return null;
    }
    return topOptions[0] || null;
  }, [options]);

  const handleVote = () => {
    if (!activeOptionHash) return;
    vote(activeOptionHash);
  };

  const handleSelectOption = (hash: string) => {
    if (isVoted) return;
    setActiveOptionHash((prev) => (prev === hash ? null : hash));
  };

  const canVote = !!activeOptionHash && validProof;

  useEffect(() => {
    if (isLoading || loadProgressBar) return;
    const timeout = setTimeout(() => {
      setLoadProgressBar(true);
    }, 1000);
    return () => {
      clearTimeout(timeout);
    };
  }, [isLoading, loadProgressBar]);

  if (error) {
    return <PollCardError title={"Error fetching Poll"} description={error} />;
  }

  if (isLoading || !metadata) {
    return <PollCardSkeleton />;
  }

  return (
    <>
      <Card className="w-full max-w-xl sm:p-4">
        <CardHeader>
          <CardTitle>{metadata.title}</CardTitle>
          {metadata.description?.trim() && (
            <CardDescription>{metadata!.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <ul className="flex flex-col gap-2">
              {options.map((option, index) => (
                <li key={index}>
                  <Button
                    size="lg"
                    className={cn(
                      "relative w-full px-12",
                      activeOptionHash === option.hash &&
                        "overflow-hidden rounded-lg border-2 border-primary/40 bg-primary/20 hover:bg-primary/20",
                    )}
                    loading={isLoading}
                    onClick={() => handleSelectOption(option.hash)}
                    variant="outline"
                  >
                    <div
                      className={cn(
                        "absolute bottom-0 left-0 h-full bg-green-400/30 transition-all duration-500 ease-in-out",
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
                        winnerOption?.hash === option.hash &&
                          "font-bold text-green-600",
                      )}
                    >
                      {option.votesPercentage}%
                    </div>
                  </Button>
                </li>
              ))}
            </ul>
            {!!account && !isVoted && (
              <Button
                size="lg"
                className="w-full"
                type="submit"
                onClick={handleVote}
                disabled={!canVote}
                loading={isVoting}
              >
                Vote
              </Button>
            )}
            {!account && (
              <Button
                size="lg"
                className="w-full"
                loading={isLoading}
                onClick={connect}
              >
                Connect your Auro Wallet
              </Button>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex gap-2">
          <Button
            className="w-full"
            loading={isLoading}
            onClick={() => setOpenVotersModal(true)}
            variant="outline"
          >
            Eligible Voters
            <Badge
              className={cn(
                "ml-2",
                validProof
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700",
              )}
            >
              {metadata!.votersWallets.length}
            </Badge>
          </Button>
          <Button
            className="w-full"
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast({
                title: "Link copied to clipboard",
              });
            }}
            variant="outline"
          >
            Share
            <Share2Icon className="ml-2 h-4 w-4 text-violet-500" />
          </Button>
        </CardFooter>
      </Card>
      <VotersModal
        votersWallets={metadata!.votersWallets}
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
          <DialogTitle>Eligible Voters Wallets</DialogTitle>
          <DialogDescription>
            View the wallets that are eligible to vote in this poll. Remember
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
