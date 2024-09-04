"use client";
import "./globals.css";
import { Inter as FontSans } from "next/font/google";
import { cn } from "@/lib/cn";
import { Toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { useChain } from "@/hooks/useChain";
import Header from "@/components/header";

export const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
