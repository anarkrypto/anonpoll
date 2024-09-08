"use client";

import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { useEffect } from "react";

import { usePollBlockHeight } from "@/lib/stores/chain";
import { useObserveBalance } from "@/lib/stores/balances";
import { useNotifyTransactions, useWalletStore } from "@/lib/stores/wallet";

import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/cn";
import { useClientStore } from "@/lib/stores/client";
import { useAuthStore } from "@/lib/stores/auth";
import InstallAuroWalletModal from "@/components/install-auro-wallet-modal";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = useWalletStore();
  const startClient = useClientStore((state) => state.start);
  const verifyAuth = useAuthStore((state) => state.verifyAuth);

  usePollBlockHeight();
  useObserveBalance();
  useNotifyTransactions();

  useEffect(() => {
    // init on mount
    startClient();
    if (wallet.walletInstalled) {
      wallet.initializeWallet();
      wallet.observeWalletChange();
    }
    verifyAuth();
  }, []);

  return (
    <html lang="en" className="h-full">
      <body
        className={cn(
          "flex min-h-screen flex-col bg-gradient-to-b from-background to-primary/5 font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Header />
        {children}
        <Toaster />
        <InstallAuroWalletModal
          open={wallet.showInstallWalletModal}
          onOpenChange={wallet.openChangeInstallWalletModal}
        />
      </body>
    </html>
  );
}
