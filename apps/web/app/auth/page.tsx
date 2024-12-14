"use client";

import InstallAuroWalletModal from "@/components/install-auro-wallet-modal";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from "@/core/hooks";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AuthPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const next = searchParams.next || "/";
  const router = useRouter();

  const { initialized: walletInitialized, connect, connected, loading } = useWallet();

  const [openInstallAuroWalletModal, setOpenInstallAuroWalletModal] =
    useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (connected) {
      router.push(next);
    }
  }, [connected]);

  const handleConnect = useCallback(async () => {
    try {
      if (!walletInitialized) {
        setOpenInstallAuroWalletModal(true);
        return;
      }
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

  return (
    <>
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-zinc-700">
            Connect your <span className="text-violet-700">Auro Wallet</span>
          </CardTitle>
          <CardDescription>
            To interact with this site, you need to connect your Auro Wallet.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            size="lg"
            className="w-full px-8 py-6 text-lg"
            onClick={handleConnect}
            loading={loading || connected}
          >
            Connect Wallet
          </Button>
        </CardContent>
      </Card>
      <InstallAuroWalletModal
        open={openInstallAuroWalletModal}
        onOpenChange={setOpenInstallAuroWalletModal}
      />
    </>
  );
}
