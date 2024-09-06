import Cookies from "js-cookie";
import { z } from "zod";
import { useWalletStore } from "@/lib/stores/wallet";
import { generateAuthJsonMessage } from "@/lib/auth";
import { authSchema } from "@/schemas/auth";
import { useToast } from "@/components/ui/use-toast";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

interface AuthState {
  isAuthenticated: boolean;
  loading: boolean;
  authenticate: () => Promise<void>;
  verifyAuth: () => void;
}

export const useAuthStore = create<AuthState, [["zustand/immer", never]]>(
  immer((set) => ({
    isAuthenticated: false,
    loading: false,
    authenticate: async () => {
      set({ loading: true });

      try {
        const { wallet, connectWallet, signJsonMessage } =
          useWalletStore.getState();

        if (!wallet) {
          await connectWallet();
        }

        const issuedAt = Date.now();
        const message = generateAuthJsonMessage(
          window.location.origin,
          issuedAt,
        );

        const { signature, publicKey } = await signJsonMessage(message);

        try {
          await fetchAuthApi({ publicKey, signature, issuedAt });
          set({ isAuthenticated: true });
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : "Try again later or contact support";
          useToast().toast({
            title: "Authentication failed",
            description: message,
            variant: "destructive",
          });
        }
      } finally {
        set({ loading: false });
      }
    },
    verifyAuth: () => {
      const token = Cookies.get("auth.token");
      set({ isAuthenticated: !!token, loading: false });
    },
  })),
);

const fetchAuthApi = async ({
  publicKey,
  signature,
  issuedAt,
}: z.infer<typeof authSchema>) => {
  const response = await fetch("/api/auth", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      publicKey,
      signature,
      issuedAt,
    }),
  });
  if (!response.ok) {
    const message = await response
      .json()
      .then((data) => (typeof data.message === "string" ? data.message : null))
      .catch(() => null);
    throw new Error(
      message || `Response Status: ${response.status} (${response.statusText})`,
    );
  }
};
