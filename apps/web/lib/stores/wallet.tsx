import { useToast } from "@/components/ui/use-toast";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { MethodIdResolver } from "@proto-kit/module";
import { useCallback, useEffect, useMemo } from "react";
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { usePrevious } from "@uidotdev/usehooks";
import { useClientStore } from "./client";
import { useChainStore } from "./chain";
import { Field, Nullifier, PublicKey, Signature, UInt64 } from "o1js";
import { truncateMiddle } from "../utils";

export interface WalletState {
  wallet?: string;
  loading: boolean;
  walletInstalled: boolean;
  showInstallWalletModal: boolean;
  openChangeInstallWalletModal: (bool: boolean) => void;
  initializeWallet: () => Promise<void>;
  connectWallet: () => Promise<void>;
  observeWalletChange: () => void;
  createNullifier: (message: number[]) => Promise<Nullifier>;
  signJsonMessage: (message: { label: string; value: string }[]) => Promise<{
    data: string;
    publicKey: string;
    signature: { field: string; scalar: string };
  }>;

  pendingTransactions: PendingTransaction[];
  addPendingTransaction: (pendingTransaction: PendingTransaction) => void;
  removePendingTransaction: (pendingTransaction: PendingTransaction) => void;
}

export const useWalletStore = create<WalletState, [["zustand/immer", never]]>(
  immer((set) => ({
    loading: typeof mina !== "undefined",
    walletInstalled: typeof mina !== "undefined",
    showInstallWalletModal: false,
    openChangeInstallWalletModal(bool: boolean) {
      set((state) => {
        state.showInstallWalletModal = bool;
      });
    },
    async initializeWallet() {
      if (typeof mina === "undefined") {
        console.log("Auro wallet not installed");
        set((state) => {
          state.showInstallWalletModal = true;
        });
        return;
      }

      set((state) => {
        state.loading = true;
      });

      const [wallet] = await mina.getAccounts();

      set((state) => {
        state.wallet = wallet;
        state.loading = false;
      });
    },
    async connectWallet() {
      if (typeof mina === "undefined") {
        console.log("Auro wallet not installed");
        set((state) => {
          state.showInstallWalletModal = true;
        });
        return;
      }

      set((state) => {
        state.loading = true;
      });

      const [wallet] = await mina.requestAccounts();

      set((state) => {
        state.wallet = wallet;
        state.loading = false;
      });
    },
    observeWalletChange() {
      if (typeof mina === "undefined") {
        console.log("Auro wallet not installed");
        set((state) => {
          state.showInstallWalletModal = true;
        });
        return;
      }

      mina.on("accountsChanged", ([wallet]) => {
        set((state) => {
          state.wallet = wallet;
        });
      });
    },
    createNullifier: async (message) => {
      if (typeof mina === "undefined") {
        console.log("Auro wallet not installed");
        set((state) => {
          state.showInstallWalletModal = true;
        });
        return;
      }
      return mina.createNullifier({ message });
    },
    signJsonMessage: async (message) => {
      if (typeof mina === "undefined") {
        throw "Auro wallet not installed";
      }
      return mina.signJsonMessage({ message });
    },

    pendingTransactions: [] as PendingTransaction[],
    addPendingTransaction(pendingTransaction) {
      set((state) => {
        // @ts-expect-error
        state.pendingTransactions.push(pendingTransaction);
      });
    },
    removePendingTransaction(pendingTransaction) {
      set((state) => {
        state.pendingTransactions = state.pendingTransactions.filter((tx) => {
          return tx.hash().toString() !== pendingTransaction.hash().toString();
        });
      });
    },
  })),
);

export const useConfirmedTransactions = () => {
  const chain = useChainStore();
  const wallet = useWalletStore();

  const confirmedTransactions = useMemo(
    () =>
      (chain.block?.txs || []).map(({ tx, status, statusMessage }) => {
        return {
          // TODO: It should probably receive a new class like ConfirmedTransaction
          tx: new PendingTransaction({
            methodId: Field(tx.methodId),
            nonce: UInt64.from(tx.nonce),
            isMessage: false,
            sender: PublicKey.fromBase58(tx.sender),
            argsFields: tx.argsFields.map((arg) => Field(arg)),
            auxiliaryData: [],
            signature: Signature.fromJSON({
              r: tx.signature.r,
              s: tx.signature.s,
            }),
          }),
          status,
          statusMessage,
        };
      }),
    [chain.block],
  );

  const confirmedPendingTransactions = useMemo(() => {
    return confirmedTransactions?.filter(({ tx }) => {
      return wallet.pendingTransactions?.find((pendingTransaction) => {
        return pendingTransaction.hash().toString() === tx.hash().toString();
      });
    });
  }, [confirmedTransactions, wallet.pendingTransactions]);

  return confirmedPendingTransactions;
};

export const useNotifyTransactions = () => {
  const wallet = useWalletStore();
  const { toast } = useToast();
  const client = useClientStore();

  const previousPendingTransactions = usePrevious(wallet.pendingTransactions);
  const newPendingTransactions = useMemo(() => {
    return wallet.pendingTransactions.filter(
      (pendingTransaction) =>
        !(previousPendingTransactions ?? []).includes(pendingTransaction),
    );
  }, [wallet.pendingTransactions, previousPendingTransactions]);

  const notifyTransaction = useCallback(
    (
      status: "PENDING" | "SUCCESS" | "FAILURE",
      transaction: UnsignedTransaction | PendingTransaction,
    ) => {
      if (!client.client) return;

      const methodIdResolver = client.client.resolveOrFail(
        "MethodIdResolver",
        MethodIdResolver,
      );

      const resolvedMethodDetails = methodIdResolver.getMethodNameFromId(
        transaction.methodId.toBigInt(),
      );

      if (!resolvedMethodDetails)
        throw new Error("Unable to resolve method details");

      const [moduleName, methodName] = resolvedMethodDetails;

      const hash = truncateMiddle(transaction.hash().toString(), 15, 15, "...");

      function title() {
        switch (status) {
          case "PENDING":
            return `⏳ Transaction sent: ${moduleName}.${methodName}`;
          case "SUCCESS":
            return `✅ Transaction successful: ${moduleName}.${methodName}`;
          case "FAILURE":
            return `❌ Transaction failed: ${moduleName}.${methodName}`;
        }
      }

      toast({
        title: title(),
        description: `Hash: ${hash}`,
      });
    },
    [client.client],
  );

  // notify about new pending transactions
  useEffect(() => {
    newPendingTransactions.forEach((pendingTransaction) => {
      notifyTransaction("PENDING", pendingTransaction);
    });
  }, [newPendingTransactions, notifyTransaction]);

  // notify about transaction success or failure
  const confirmedTransactions = useConfirmedTransactions();
  useEffect(() => {
    confirmedTransactions?.forEach(({ tx, status }) => {
      wallet.removePendingTransaction(tx);
      notifyTransaction(status ? "SUCCESS" : "FAILURE", tx);
    });
  }, [wallet.pendingTransactions, confirmedTransactions, notifyTransaction]);
};
