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
import { useMemo, useState } from "react";
import { ShieldCheckIcon } from "lucide-react";
import { generateCommitmentRoot } from "@/lib/utils";

export function PollCard({
  id,
  title,
  description,
  options,
  votersWallets,
  createdAt,
}: Omit<PollData, "creatorWallet">) {
  const wallet = useWalletStore();
  const { vote, votes, loading, commitment } = usePoll(id);
  const [openVotersModal, setOpenVotersModal] = useState(false);

  console.log("commitment", commitment);

  const validProof = useMemo(() => {
    if (!commitment) return false;
    return commitment === generateCommitmentRoot(votersWallets).toString();
  }, [votersWallets, commitment]);

  return (
    <>
      <Card className="w-full max-w-xl p-4">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
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
