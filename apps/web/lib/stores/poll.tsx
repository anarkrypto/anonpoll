import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { useConfirmedTransactions, WalletState } from "./wallet";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import { PublicKey, Bool, MerkleMap, Poseidon, Nullifier, Field } from "o1js";
import { useCallback, useEffect, useState } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";
import {
  canVote,
  message,
  OptionHash,
  OptionsHashes,
} from "chain/dist/runtime/modules/poll";
import { mockProof } from "../utils";
import { UInt32 } from "@proto-kit/library";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";

export interface PollState {
  loading: boolean;
  votes: {
    hash: string;
    votesCount: number;
  }[];
  loadPoll: (client: Client, id: number) => Promise<void>;
  vote: (
    client: Client,
    wallet: WalletState,
    id: number,
    optionText: string,
    salt: string,
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
    votes: [],
    async loadPoll(client: Client, id: number) {
      const pollId = UInt32.from(id);

      const currentCommitment = await client.query.runtime.Poll.commitments.get(
        UInt32.from(pollId),
      );

      if (!currentCommitment) {
        throw new Error("Poll not found");
      }

      const options = (await client.query.runtime.Poll.votes.get(pollId))
        ?.options;

      if (options) {
        set((state) => {
          state.loading = false;
          state.votes = options.map((vote) => {
            return {
              hash: vote.hash.toString(),
              votesCount: Number(vote.votesCount.toBigInt()),
            };
          });
        });
        return;
      }

      set((state) => {
        state.loading = false;
      });
    },

    async vote(client: Client, wallet: WalletState, id: number, optionText: string, salt: string) {
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

      const optionHash = OptionHash.fromText(optionText, salt);

      const tx = await client.transaction(sender, async () => {
        await poll.vote(pollId, optionHash, pollProof);
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },
  })),
);

export const useObservePoll = (id: number) => {
  const client = useClientStore((state) => state.client);
  const blockHeight = useChainStore((state) => state.block?.height);
  const wallet = useWalletStore((state) => state.wallet);
  const loadPoll = usePollStore((state) => state.loadPoll);

  useEffect(() => {
    if (!client || !wallet) return;
    loadPoll(client, id);
  }, [client, blockHeight, wallet]);
};

export const usePoll = (id: number) => {
  const client = useClientStore((state) => state.client);
  const pollStore = usePollStore();
  const wallet = useWalletStore();
  const [loading, setLoading] = useState(false);
  const [commitment, setCommitment] = useState<string | null>(null);

  const loadCommitment = async () => {
    if (!client) return null;
    const commitment = await client.query.runtime.Poll.commitments.get(
      UInt32.from(id),
    );
    setCommitment(commitment ? Field(commitment).toString() : null);
    setLoading(false);
  };

  useEffect(() => {
    setCommitment(null);
    setLoading(true);
    loadCommitment();
  }, [id, client]);

  useObservePoll(id);

  const vote = useCallback(
    async (optionText: string, salt: string) => {
      if (!client || !wallet.wallet) return;

      const pendingTransaction = await pollStore.vote(client, wallet, id, optionText, salt);

      wallet.addPendingTransaction(pendingTransaction);
    },
    [client, wallet.wallet],
  );

  return {
    vote,
    votes: pollStore.votes,
    loading: pollStore.loading || loading,
    commitment,
  };
};

type CreatePollData = Omit<z.infer<typeof pollInsertSchema>, "id">;

type UseCreatePollProps = {
  onError?: (message: string) => void;
  onSuccess?: (pollId: number) => void;
};

type CreatePollResult = {
  createPoll: (data: CreatePollData) => Promise<void>;
  loading: boolean;
};

export const useCreatePoll = ({
  onError,
  onSuccess,
}: UseCreatePollProps = {}): CreatePollResult => {
  const client = useClientStore((state) => state.client);
  const { wallet, addPendingTransaction } = useWalletStore();
  const confirmedTransactions = useConfirmedTransactions();

  const [transaction, setTransaction] = useState<PendingTransaction | null>(
    null,
  );
  const [pollData, setPollData] = useState<CreatePollData | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setTransaction(null);
    setPollData(null);
    setLoading(false);
  };

  const createPoll = useCallback(
    async (data: CreatePollData) => {
      if (!client || !wallet) {
        onError?.("Client or wallet not initialized");
        return;
      }

      try {
        setLoading(true);

        const poll = client.runtime.resolve("Poll");
        const sender = PublicKey.fromBase58(wallet);
        const map = new MerkleMap();

        data.votersWallets.forEach((address) => {
          const publicKey = PublicKey.fromBase58(address);
          const hashKey = Poseidon.hash(publicKey.toFields());
          map.set(hashKey, Bool(true).toField());
        });

        const optionsHashes = OptionsHashes.fromTexts(data.options, data.salt);

        const tx = await client.transaction(sender, async () => {
          await poll.createPoll(map.getRoot(), optionsHashes);
        });
        await tx.sign();
        await tx.send();

        isPendingTransaction(tx.transaction);
        addPendingTransaction(tx.transaction);

        setPollData(data);
        setTransaction(tx.transaction);
      } catch (error) {
        reset();
        onError?.(
          error instanceof Error ? error.message : "Failed to create poll",
        );
      }
    },
    [client, wallet, addPendingTransaction, onError],
  );

  useEffect(() => {
    const persistPollData = async () => {
      if (!transaction || !client || !wallet || !pollData) return;

      const confirmed = confirmedTransactions.find(
        (tx) => tx.tx.hash().toString() === transaction.hash().toString(),
      );

      if (confirmed) {
        try {
          const id = await client.query.runtime.Poll.lastPollId.get();

          if (!id) {
            throw new Error("Could not get poll id");
          }

          const newPollId = Number(id.toBigInt());

          await persistPoll({
            id: newPollId,
            ...(pollData as unknown as CreatePollData),
          });

          onSuccess?.(newPollId);
        } catch (error) {
          onError?.(
            error instanceof Error
              ? error.message
              : "Failed to persist poll data",
          );
        } finally {
          reset();
        }
      }
    };

    persistPollData();
  }, [confirmedTransactions, client, wallet, onError, onSuccess]);

  return { createPoll, loading };
};

const persistPoll = async (
  data: z.infer<typeof pollInsertSchema>,
): Promise<void> => {
  const response = await fetch("/api/polls", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const errorMessage =
      errorData && typeof errorData.message === "string"
        ? errorData.message
        : "Failed to persist poll data";
    throw new Error(errorMessage);
  }
};
