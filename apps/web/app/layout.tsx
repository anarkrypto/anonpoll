"use client";

import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/cn";
import { ZeroPollProvider } from "@/core/context-provider";
import { TransactionNotifications } from "@/components/transaction-notifications";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body
        className={cn(
          "flex min-h-screen flex-col bg-gradient-to-b from-background to-primary/5 font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ZeroPollProvider
          protokitGraphqlUrl={process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL!}
          storeApiUrl={process.env.NEXT_PUBLIC_SITE_URL!}
        >
          <Header />
          {children}
          <Toaster />
          <TransactionNotifications />
        </ZeroPollProvider>
      </body>
    </html>
  );
}
