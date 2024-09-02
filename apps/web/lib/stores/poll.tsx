import { create } from "zustand";
import { Client, useClientStore } from "./client";
import { WalletState } from "./wallet";
import { immer } from "zustand/middleware/immer";
import { PendingTransaction, UnsignedTransaction } from "@proto-kit/sequencer";
import {
  PublicKey,
  Bool,
  MerkleMap,
  Poseidon,
  Nullifier,
} from "o1js";
import { useCallback, useEffect } from "react";
import { useChainStore } from "./chain";
import { useWalletStore } from "./wallet";
import {
  canVote,
  message,
} from "chain/dist/runtime/modules/poll";
import { mockProof } from "../utils";

export interface PollState {
  loading: boolean;
  votes: { yayes: BigInt; nays: BigInt };
  loadPoll: (
    client: Client,
    address: string,
  ) => Promise<PendingTransaction | void>;
  vote: (
    client: Client,
    wallet: WalletState,
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
      yayes: BigInt(0),
      nays: BigInt(0),
    },
    async loadPoll(client: Client, address: string) {
      const sender = PublicKey.fromBase58(address);

      const poll = client.runtime.resolve("Poll");

      const currentCommitment =
        await client.query.runtime.Poll.commitment.get();

      if (!currentCommitment) {
        const publicKey = PublicKey.fromBase58(address);
        const map = new MerkleMap();
        const hashKey = Poseidon.hash(publicKey.toFields());
        map.set(hashKey, Bool(true).toField());

        const tx = await client.transaction(sender, async () => {
          await poll.setCommitment(map.getRoot());
        });
        await tx.sign();
        await tx.send();

        isPendingTransaction(tx.transaction);

        set((state) => {
          state.loading = false;
        });

        return tx.transaction;
      }

      const pollData = await client.query.runtime.Poll.votes.get()

      set((state) => {
        state.loading = false;
        state.votes = {
          yayes: pollData?.yayes.toBigInt() ?? BigInt(0),
          nays: pollData?.nays.toBigInt() ?? BigInt(0),
        };
      });
    },

    async vote(client: Client, wallet: WalletState, vote: boolean) {
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
        await poll.vote(Bool(vote), pollProof);
      });

      await tx.sign();
      await tx.send();

      isPendingTransaction(tx.transaction);
      return tx.transaction;
    },
  })),
);

export const useObservePoll = () => {
  const client = useClientStore();
  const chain = useChainStore();
  const wallet = useWalletStore();
  const pollStore = usePollStore();

  const loadPoll = async () => {
    if (!client.client || !wallet.wallet) return;
    const pendingTransaction = await pollStore.loadPoll(client.client, wallet.wallet);
    if (pendingTransaction) {
      wallet.addPendingTransaction(pendingTransaction);
    }
  };

  useEffect(() => {
    loadPoll();
  }, [client.client, chain.block?.height]);
};

export const usePoll = () => {
  const client = useClientStore();
  const pollStore = usePollStore();
  const wallet = useWalletStore();

  const vote = useCallback(
    async (bool: boolean) => {
      if (!client.client || !wallet.wallet) return;

      const pendingTransaction = await pollStore.vote(
        client.client,
        wallet,
        bool,
      );

      wallet.addPendingTransaction(pendingTransaction);
    },
    [client.client, wallet.wallet],
  );

  return { vote, votes: pollStore.votes, loading: pollStore.loading };
};
