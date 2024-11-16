import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/toaster";
import { cn } from "@/lib/cn";
import { EngineProvider } from "@/core/engine-context";
import { TransactionNotifications } from "@/components/transaction-notifications";
import { Metadata } from "next";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "ZeroPoll",
  description: "A private voting system powered by zero-knowledge proofs",
}

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
        <EngineProvider
          protokitGraphqlUrl={process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL!}
          storeApiUrl={process.env.NEXT_PUBLIC_SITE_URL!}
        >
          <Header />
          {children}
          <Toaster />
          <TransactionNotifications />
        </EngineProvider>
      </body>
    </html>
  );
}
