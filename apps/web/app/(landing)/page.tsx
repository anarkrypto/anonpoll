import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Shield, Lock, Vote } from "lucide-react";
import { cn } from "@/lib/cn";
import { Montserrat } from "next/font/google";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
});

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-purple-50 to-background p-4">
      <main className="w-full max-w-4xl space-y-8">
        <h1 className={cn(montserrat.className, "text-6xl font-semibold text-center")}>
          Zero<span className="font-bold text-primary">Poll</span>
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
              icon={<Vote className="h-8 w-8 text-purple-500" />}
              title="Verifiable"
              description="Ensure the integrity of the voting results without compromising privacy"
            />
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href="/new" passHref>
            <Button size="lg" className="px-8 py-6 text-lg">
              Create a New Poll
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
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
