"use client";

import InstallAuroWalletModal from "@/components/install-auro-wallet-modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@/core/hooks";
import { DialogProps } from "@radix-ui/react-dialog";
import { useCallback, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "./ui/dialog";

export function ConnectWalletModal({
  onConnected,
  ...props
}: {
  onConnected?: () => void;
} & DialogProps) {
  const {
    initialized: walletInitialized,
    connect,
    connected,
    loading,
  } = useWallet();

  const { toast } = useToast();

  useEffect(() => {
    if (connected) {
      onConnected?.();
    }
  }, [connected]);

  const handleConnect = useCallback(async () => {
    try {
      await connect();
    } catch (error) {
      console.error("Error connecting wallet", error);
      const message =
        error instanceof Error ? error.message : "Check logs for more details";
      toast({
        title: "Error connecting wallet",
        description: message,
        variant: "destructive",
      });
    }
  }, [connected, toast, walletInitialized]);

  if (!walletInitialized) {
    return <InstallAuroWalletModal {...props} />;
  }

  return (
    <Dialog modal {...props}>
      <DialogContent className="bg-white text-zinc-800 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-zinc-700">
            Connect your <span className="text-violet-700">Auro Wallet</span>
          </DialogTitle>
          <DialogDescription>
            To interact with this site, you need to connect your Auro Wallet.
          </DialogDescription>
        </DialogHeader>
        <Button
          size="lg"
          className="w-full px-8 py-6 text-lg"
          onClick={handleConnect}
          loading={loading || connected}
        >
          Connect Wallet
        </Button>
      </DialogContent>
    </Dialog>
  );
}
