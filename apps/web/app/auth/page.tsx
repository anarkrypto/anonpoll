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
import { useAuth, useWallet } from "@/core/hooks";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function AuthPage() {
  const next = useSearchParams().get("next") || "/";
  const router = useRouter();

  const { initialized: walletInitialized } = useWallet();

  const { isAuthenticated, authenticate, loading } = useAuth();

  const [openInstallAuroWalletModal, setOpenInstallAuroWalletModal] =
    useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated) {
      router.refresh();
      router.push(next);
    }
  }, [isAuthenticated]);

  const handleAuthenticate = useCallback(async () => {
    try {
      if (!walletInitialized) {
        setOpenInstallAuroWalletModal(true);
        return;
      }
      await authenticate();
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
  }, [authenticate, toast, walletInitialized]);

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
            onClick={handleAuthenticate}
            loading={loading || isAuthenticated}
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
