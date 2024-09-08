"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, Lock, Vote } from "lucide-react";
import { cn } from "@/lib/cn";
import { Montserrat } from "next/font/google";
import { useWalletStore } from "@/lib/stores/wallet";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function LandingPage() {
  const [walletInstalled, openChangeInstallWalletModal] = useWalletStore(
    (state) => [state.walletInstalled, state.openChangeInstallWalletModal],
  );

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4">
      <main className="w-full max-w-4xl space-y-8">
        <h1 className={cn(montserrat.className, "text-center text-6xl")}>
          <span className="bg-gradient-to-b from-zinc-600 to-zinc-800 bg-clip-text font-semibold text-transparent">
            Zero
          </span>
          <span className="bg-gradient-to-b from-violet-500 to-violet-700 bg-clip-text font-bold text-transparent">
            Poll
          </span>
        </h1>
        <p className="text-center text-xl text-gray-600">
          A private voting system powered by zero-knowledge proofs
        </p>

        <Card className="bg-white shadow-lg">
          <CardHeader>
            <CardTitle className="text-center text-2xl font-semibold">
              Secure, Anonymous, and Verifiable
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <FeatureCard
              icon={<Shield className="h-8 w-8 text-blue-500" />}
              title="Secure"
              description="Your vote is protected by state-of-the-art cryptography"
            />
            <FeatureCard
              icon={<Lock className="h-8 w-8 text-green-500" />}
              title="Private"
              description="Your identity remains anonymous throughout the voting process"
            />
            <FeatureCard
              icon={<Vote className="h-8 w-8 text-violet-500" />}
              title="Verifiable"
              description="Ensure the integrity of the voting results without compromising privacy"
            />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          {!walletInstalled ? (
            <Button
              size="lg"
              className="px-8 py-6 text-lg"
              onClick={() => {
                openChangeInstallWalletModal(true);
              }}
            >
              Create a New Poll
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          ) : (
            <Link href="/new" passHref>
              <Button size="lg" className="px-8 py-6 text-lg">
                Create a New Poll
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>

        <p className="mt-8 text-center text-gray-600">
          Experience the future of voting with our cutting-edge zero-knowledge
          proof technology. Create polls, cast votes, and verify results - all
          while maintaining anonymity.
        </p>
      </main>

      <footer className="mt-16 text-center text-gray-500">
        © 2024 ZeroPoll. All rights reserved.
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center space-y-2 text-center">
      {icon}
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
