import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { useConfirmedTransactions, WalletState } from "./wallet";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { PublicKey, Bool, MerkleMap, Poseidon, Nullifier } from "o1js";
import { useCallback, useEffect, useState } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";
import { canVote, message } from "chain/dist/runtime/modules/poll";
import { mockProof } from "../utils";
import { UInt32 } from "@proto-kit/library";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";

export interface PollState {
  loading: boolean;
  votes: { yayes: number; nays: number };
  loadPoll: (client: Client, id: number) => Promise<void>;
  vote: (
    client: Client,
    wallet: WalletState,
    id: number,
    vote: boolean,
  ) => Promise<PendingTransaction>;
}

function isPendingTransaction(
  transaction: PendingTransaction | UnsignedTransaction | undefined,
): asserts transaction is PendingTransaction {
  if (!(transaction instanceof PendingTransaction))
    throw new Error("Transaction is not a PendingTransaction");
}

export const usePollStore = create<PollState, [["zustand/immer", never]]>(
  immer((set) => ({
    loading: true,
    votes: {
      yayes: 0,
      nays: 0,
    },
    async loadPoll(client: Client, id: number) {
      const pollId = UInt32.from(id);

      const currentCommitment = await client.query.runtime.Poll.commitments.get(
        UInt32.from(pollId),
      );

      if (!currentCommitment) {
        throw new Error("Poll not found");
      }

      const pollData = await client.query.runtime.Poll.votes.get(pollId);

      set((state) => {
        state.loading = false;
        state.votes = {
          yayes: Number(pollData?.yayes.toBigInt() ?? BigInt(0)),
          nays: Number(pollData?.nays.toBigInt() ?? BigInt(0)),
        };
      });
    },

    async vote(client: Client, wallet: WalletState, id: number, vote: boolean) {
      const pollId = UInt32.from(id);

      if (!wallet.wallet) {
        throw new Error("Wallet not initialized");
      }

      const poll = client.runtime.resolve("Poll");
      const sender = PublicKey.fromBase58(wallet.wallet);

      // reconstruct the merkle map with the sender's public key
      const map = new MerkleMap();
      const hashKey = Poseidon.hash(sender.toFields());
      map.set(hashKey, Bool(true).toField());

      // get the witness for the sender's public key
      const witness = map.getWitness(hashKey);

      // Ask for Auro Wallet to create a nullifier
      const jsonNullifier = (await wallet.createNullifier(
        message.map((f) => Number(f.toBigInt())),
      )) as any;

      const nullifier = Nullifier.fromJSON(jsonNullifier);

      const publicOutput = await canVote(witness, nullifier);

      const pollProof = await mockProof(publicOutput);

      const tx = await client.transaction(sender, async () => {
        await poll.vote(pollId, Bool(vote), pollProof);
      });

      await tx.sign();
      await tx.send();

      console.log("transaction", tx.transaction?.sender.toBase58());

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },
  })),
);

export const useObservePoll = (id: number) => {
  const client = useClientStore();
  const chain = useChainStore();
  const wallet = useWalletStore();
  const pollStore = usePollStore();

  useEffect(() => {
    if (!client.client || !wallet.wallet) return;
    pollStore.loadPoll(client.client, id);
  }, [client.client, chain.block?.height, wallet.wallet]);
};

export const usePoll = (id: number) => {
  const client = useClientStore();
  const pollStore = usePollStore();
  const wallet = useWalletStore();

  useObservePoll(id);

  const vote = useCallback(
    async (bool: boolean) => {
      if (!client.client || !wallet.wallet) return;

      const pendingTransaction = await pollStore.vote(
        client.client,
        wallet,
        id,
        bool,
      );

      wallet.addPendingTransaction(pendingTransaction);
    },
    [client.client, wallet.wallet],
  );

  return { vote, votes: pollStore.votes, loading: pollStore.loading };
};

export const useCreatePoll = ({
  onError,
}: {
  onError?: (message: string) => void;
} = {}) => {
  const client = useClientStore((state) => state.client);
  const { wallet, addPendingTransaction } = useWalletStore();
  const confirmedTransactions = useConfirmedTransactions();
  const [transaction, setTransaction] = useState<PendingTransaction | null>(
    null,
  );
  const [votersAddresses, setVotersAddresses] = useState<string[]>([]);
  const [pollId, setPollId] = useState<number | null>(null);
  const [pollName, setPollName] = useState<string>("");

  const createPoll = useCallback(
    async (pollName: string, votersAddresses: string[]) => {
      if (!client || !wallet) return;

      const poll = client.runtime.resolve("Poll");

      const sender = PublicKey.fromBase58(wallet);

      const map = new MerkleMap();

      votersAddresses.forEach((address) => {
        const publicKey = PublicKey.fromBase58(address);
        const hashKey = Poseidon.hash(publicKey.toFields());
        map.set(hashKey, Bool(true).toField());
      });

      const tx = await client.transaction(sender, async () => {
        await poll.createPoll(map.getRoot());
      });
      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);

      setVotersAddresses(votersAddresses);
      setPollName(pollName);

      addPendingTransaction(tx.transaction);

      setTransaction(tx.transaction);
    },
    [client, wallet],
  );

  useEffect(() => {
    const persistPollData = async () => {
      if (
        !transaction ||
        !client ||
        pollId ||
        !votersAddresses.length ||
        !wallet ||
        !pollName
      )
        return;

      const confirmed = confirmedTransactions.find(
        (tx) => tx.tx.hash().toString() === transaction.hash().toString(),
      );

      if (confirmed) {
        try {
          const id = await client.query.runtime.Poll.lastPollId.get();

          if (!id) {
            onError?.("Could not get poll id");
            return;
          }

          const newPollId = Number(id.toBigInt());

          await persistPoll({
            id: newPollId,
            title: pollName,
            description: null,
            options: [],
            votersWallets: votersAddresses,
          });

          setPollId(newPollId);
        } catch (error) {
          onError?.("Failed to persist poll data");
        }
      }
    };

    persistPollData();
  }, [confirmedTransactions, transaction, pollId, votersAddresses, pollName]);

  return { createPoll, pollId, transaction };
};

const persistPoll = async (data: z.infer<typeof pollInsertSchema>) => {
  return fetch("/api/polls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: data.id,
      title: data.title,
      description: data.description,
      options: data.options,
      votersWallets: data.votersWallets,
    }),
  });
};
