"use client";

import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { useEffect } from "react";

import { usePollBlockHeight } from "@/lib/stores/chain";
import { useObserveBalance } from "@/lib/stores/balances";
import { useNotifyTransactions } from "@/lib/stores/wallet";
import { useChain } from "@/hooks/useChain";

import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/cn";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  usePollBlockHeight();
  useObserveBalance();
  useNotifyTransactions();
  const { init } = useChain();

  useEffect(() => {
    init();
  }, []);

  return (
    <html lang="en" className="h-full">
      <body
        className={cn(
          "flex min-h-full flex-col bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Header />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
