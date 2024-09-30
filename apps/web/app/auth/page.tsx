"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAuthStore } from "@/lib/stores/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function AuthPage() {
  const next = useSearchParams().get("next") || "/";
  const router = useRouter();

  const [isAuthenticated, authenticate, loading] = useAuthStore((state) => [
    state.isAuthenticated,
    state.authenticate,
    state.loading,
  ]);

  useEffect(() => {
    if (isAuthenticated) {
      router.refresh();
      router.push(next);
    }
  }, [isAuthenticated]);

  return (
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
          onClick={() => {
            authenticate();
          }}
          loading={loading}
        >
          Connect Wallet
        </Button>
      </CardContent>
    </Card>
  );
}
