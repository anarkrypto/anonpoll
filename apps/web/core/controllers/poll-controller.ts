import { UInt32 } from "@proto-kit/library";
import { BaseController } from "./base-controller";
import { ChainController } from "./chain-controller";
import {
  ModuleQuery,
  PendingTransaction,
  UnsignedTransaction,
} from "@proto-kit/sequencer";
import { canVote, Poll } from "chain/dist/runtime/modules/poll";
import { Bool, Field, MerkleMap, Nullifier, Poseidon, PublicKey } from "o1js";
import { mockProof } from "@/lib/utils";
import { WalletController } from "./wallet-controller";
import { isPendingTransaction } from "../utils";

export interface PollState {
  loading: boolean;
  votes: {
    hash: string;
    votesCount: number;
  }[];
}

export class PollController extends BaseController<PollState> {
  private wallet: WalletController;
  private chain: ChainController;
  private pollQuery: ModuleQuery<Poll>;
  private poll: Poll;
  private voters = new Set<string>();

  constructor(wallet: WalletController, chain: ChainController, initialState: Partial<PollState> = {}) {
    super(initialState);
    this.wallet = wallet;
    this.chain = chain;
    this.pollQuery = chain.client.query.runtime.Poll;
    this.poll = chain.client.runtime.resolve("Poll");
  }

  public async loadPoll(id: number) {
    const pollId = UInt32.from(id);

    const currentCommitment = await this.pollQuery.commitments.get(
      UInt32.from(pollId),
    );

    if (!currentCommitment) {
      throw new Error("Poll not found");
    }

    const options = (await this.pollQuery.votes.get(pollId))?.options;

    if (options) {
      this.state.loading = false;
      this.state.votes = options.map((vote) => {
        return {
          hash: vote.hash.toString(),
          votesCount: Number(vote.votesCount.toBigInt()),
        };
      });
      return;
    }

    this.state.loading = false;

    this.observePoll(id);
  }

  private observePoll(id: number) {
    this.chain.subscribe((_, changedState) => {
      if ("blocks" in changedState) {
        this.loadPoll(id);
      }
    });
  }

  public async vote(
    id: number,
    optionHash: string,
  ) {
    const pollId = UInt32.from(id);

    if (!this.wallet.account) {
      throw new Error("Wallet not initialized");
    }

    const sender = PublicKey.fromBase58(this.wallet.account);

    // reconstruct the merkle map with the voters's public key
    const map = new MerkleMap();
    this.voters.forEach((wallet) => {
      const hashKey = Poseidon.hash(PublicKey.fromBase58(wallet).toFields());
      map.set(hashKey, Bool(true).toField());
    });

    // get the witness for the sender's public key
    const hashKey = Poseidon.hash(sender.toFields());
    const witness = map.getWitness(hashKey);

    // Ask for Auro Wallet to create a nullifier
    const jsonNullifier = (await this.wallet.createNullifier(
      [pollId].map((f) => Number(f.toBigInt())),
    )) as any;

    const nullifier = Nullifier.fromJSON(jsonNullifier);

    const publicOutput = await canVote(witness, nullifier, pollId);

    const pollProof = await mockProof(publicOutput);

    const tx = await this.chain.client.transaction(sender, async () => {
      await this.poll.vote(pollId, Field(optionHash), pollProof);
    });

    await tx.sign();
    await tx.send();

    isPendingTransaction(tx.transaction);
    return tx.transaction;
  }

  get votes() {
    return this.state.votes;
  }

  get loading() {
    return this.state.loading;
  }
}

