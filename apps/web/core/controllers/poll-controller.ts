import {
  Bool,
  Field,
  MerkleMap,
  MerkleMapWitness,
  Poseidon,
  PublicKey,
} from "o1js";
import { UInt32 } from "@proto-kit/library";
import { client } from "chain";
import { canVote, OptionsHashes, Poll } from "chain/dist/runtime/modules/poll";
import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { ChainController } from "./chain-controller";
import { mockProof } from "@/lib/utils";
import { WalletController } from "./wallet-controller";
import { isPendingTransaction } from "../utils";
import { AbstractPollStore } from "../providers/stores/poll-store";
import { PollData } from "@/types/poll";

export interface PollConfig extends BaseConfig {
  wallet: WalletController;
  chain: ChainController;
  client: Pick<typeof client, "query" | "runtime" | "transaction">;
  store: AbstractPollStore;
}

export interface PollState extends BaseState {
  loading: boolean;
  metadata: PollData | null;
  options: {
    text: string;
    hash: string;
    votesCount: number;
  }[];
}

export class PollController extends BaseController<PollConfig, PollState> {
  private wallet: WalletController;
  private chain: ChainController;
  private client: Pick<typeof client, "query" | "runtime" | "transaction">;
  private voters = new Set<string>();
  private store: AbstractPollStore;

  readonly defaultState: PollState = {
    loading: false,
    metadata: null,
    options: [],
  };

  constructor(config: PollConfig, state: Partial<PollState> = {}) {
    super(config, state);
    this.wallet = config.wallet;
    this.chain = config.chain;
    this.client = config.client;
    this.store = config.store;
    this.initialize();
  }

  public async loadPoll(id: number) {
    try {
      const pollId = UInt32.from(id);

      this.update({ loading: true });

      const metadata = await this.getMetadata(id);

      const voteOptions = await this.getVotesOptions(pollId);

      this.compareHashes(
        voteOptions.map(({ hash }) => hash),
        metadata.options,
        metadata.salt,
      );

      this.update({
        metadata,
        options: metadata.options.map((text, index) => {
          return {
            text,
            hash: voteOptions[index].hash,
            votesCount: voteOptions[index].votesCount,
          };
        }),
      });

      this.observePoll(id);
    } catch (error) {
      throw error;
    } finally {
      this.update({ loading: false });
    }
  }

  private async getMetadata(id: number) {
    if (this.state.metadata?.id === id) {
      return this.state.metadata;
    }

    const metadata = await this.store.getById(id);

    if (metadata.options.length < 2) {
      throw new Error("Poll must have at least 2 options");
    }

    return metadata;
  }

  private async getVotesOptions(pollId: UInt32) {
    const votesOptions = (
      await this.client.query.runtime.Poll.votes.get(pollId)
    )?.options.map((option) => {
      return {
        hash: option.hash.toString(),
        votesCount: Number(option.votesCount.toBigInt()),
      };
    });

    if (!votesOptions) {
      throw new Error("Votes not found");
    }

    return votesOptions;
  }

  private compareHashes(hashes: string[], optionsText: string[], salt: string) {
    const computedHashes = OptionsHashes.fromTexts(optionsText, salt)
      .hashes as Field[];
    if (
      !computedHashes.every(
        (value, index) => value.toString() === hashes[index],
      )
    ) {
      throw new Error("Options hashes do not match");
    }
  }

  private observePoll(id: number) {
    this.chain.subscribe(async (_, changedState) => {
      if ("block" in changedState) {
        await this.loadPoll(id);
      }
    });
  }

  public async vote(optionHash: string) {
    this.validateVotePrerequisites();

    const pollId = UInt32.from(this.state.metadata!.id);
    const sender = PublicKey.fromBase58(this.wallet.account!);

    const witness = this.createVotersWitness(sender);
    const proof = await this.createVoteProof(witness, pollId);

    return this.submitVoteTransaction(pollId, optionHash, proof);
  }

  private validateVotePrerequisites() {
    if (!this.wallet.account) {
      throw new Error("Wallet not initialized");
    }
    if (!this.state.metadata) {
      throw new Error("Poll not loaded");
    }
  }

  private createVotersWitness(sender: PublicKey) {
    const map = new MerkleMap();
    this.voters.forEach((wallet) => {
      const hashKey = Poseidon.hash(PublicKey.fromBase58(wallet).toFields());
      map.set(hashKey, Bool(true).toField());
    });

    const hashKey = Poseidon.hash(sender.toFields());
    return map.getWitness(hashKey);
  }

  private async createVoteProof(witness: MerkleMapWitness, pollId: UInt32) {
    const nullifier = await this.wallet.createNullifier([
      Number(pollId.toString()),
    ]);
    const publicOutput = await canVote(witness, nullifier, pollId);
    return await mockProof(publicOutput);
  }

  private async submitVoteTransaction(
    pollId: UInt32,
    optionHash: string,
    proof: any,
  ) {
    const poll = this.client.runtime.resolve("Poll");
    const tx = await this.client.transaction(
      PublicKey.fromBase58(this.wallet.account!),
      async () => {
        await poll.vote(pollId, Field(optionHash), proof);
      },
    );

    await tx.sign();
    await tx.send();

    isPendingTransaction(tx.transaction);
    this.wallet.addPendingTransaction(tx.transaction);

    return tx.transaction;
  }

  public get metadata() {
    return this.state.metadata;
  }

  public get options() {
    return this.state.options;
  }

  public get loading() {
    return this.state.loading;
  }
}
