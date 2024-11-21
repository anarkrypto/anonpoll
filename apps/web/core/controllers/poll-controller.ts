import {
  Bool,
  Field,
  MerkleMap,
  MerkleMapWitness,
  Poseidon,
  PublicKey,
} from "o1js";
import { UInt32 } from "@proto-kit/library";
import type { client } from "chain";
import {
  canVote,
  OptionsHashes,
  PollProof,
  PollPublicOutput,
} from "chain/dist/runtime/modules/poll";
import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { ChainController } from "./chain-controller";
import { WalletController } from "./wallet-controller";
import { isPendingTransaction } from "../utils";
import { AbstractPollStore } from "../stores/poll-store";
import { PollData } from "@/types/poll";

export interface PollConfig extends BaseConfig {
  wallet: WalletController;
  chain: ChainController;
  client: Pick<typeof client, "query" | "runtime" | "transaction">;
  store: AbstractPollStore;
}

export interface PollState extends BaseState {
  loading: boolean;
  commitment: string | null;
  metadata: PollData | null;
  options: {
    text: string;
    hash: string;
    votesCount: number;
    votesPercentage: number;
  }[];
}

interface VotingResult {
  hash: string;
  votesCount: number;
}

export class PollController extends BaseController<PollConfig, PollState> {
  private wallet: WalletController;
  private chain: ChainController;
  private client: Pick<typeof client, "query" | "runtime" | "transaction">;
  private voters = new Set<PublicKey>();
  private store: AbstractPollStore;

  readonly defaultState: PollState = {
    commitment: null,
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

      if (this.metadata?.id === id) {
        // Do not load the same poll twice
        return;
      }

      this.update({
        loading: true,
        commitment: null,
        metadata: null,
        options: [],
      });

      const [metadata, votingResults, commitment] = await Promise.all([
        this.getMetadata(id),
        this.getVoteResults(pollId),
        this.getCommitment(pollId),
      ]);

      // Check if the options hashes match the ones on-chain
      this.compareHashes(
        votingResults.map(({ hash }) => hash),
        metadata.options,
        metadata.salt,
      );

      const options = this.buildOptions(metadata, votingResults);

      this.update({
        commitment,
        metadata,
        options,
      });

      metadata.votersWallets.forEach((wallet) =>
        this.voters.add(PublicKey.fromBase58(wallet)),
      );

      this.observePoll();
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

  private async getVoteResults(pollId: UInt32) {
    const votesOptions = (
      await this.client.query.runtime.Poll.votes.get(pollId)
    )?.options.map((option) => {
      return {
        hash: option.hash.toString() as string,
        votesCount: Number(option.votesCount.toBigInt()),
      };
    });

    if (!votesOptions) {
      throw new Error("Votes not found");
    }

    return votesOptions;
  }

  private async getCommitment(pollId: UInt32) {
    const commitment = await this.client.query.runtime.Poll.commitments.get(
      UInt32.from(pollId),
    );
    if (!commitment) {
      throw new Error("Poll not found");
    }
    return Field(commitment).toString();
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

  private buildOptions(metadata: PollData, votingResults: VotingResult[]) {
    const totalVotesCast = votingResults.reduce(
      (acc, option) => acc + option.votesCount,
      0,
    );

    // TODO: Investigate implications of relying on the index of the options

    return metadata.options.map((text, index) => {
      const votesCount = votingResults[index].votesCount || 0;
      const votesPercentage =
        totalVotesCast === 0 ? 0 : (votesCount / totalVotesCast) * 100;
      return {
        text,
        hash: votingResults[index].hash,
        votesCount: votingResults[index].votesCount,
        votesPercentage,
      };
    });
  }

  private observePoll() {
    this.chain.subscribe(async (_, changedState) => {
      if ("block" in changedState) {
        await this.updateVotingResults();
      }
    });
  }

  private async updateVotingResults() {
    if (!this.metadata) {
      throw new Error("Poll not loaded");
    }

    const votingResults = await this.getVoteResults(
      UInt32.from(this.metadata.id),
    );

    const options = this.buildOptions(this.metadata, votingResults);

    this.update({
      options,
    });
  }

  public async vote(optionHash: string): Promise<{ hash: string }> {
    this.validateVotePrerequisites();

    const pollId = UInt32.from(this.state.metadata!.id);
    const sender = PublicKey.fromBase58(this.wallet.account!);

    const witness = this.createVotersWitness(sender);
    const proof = await this.createVoteProof(witness, pollId);

    const hash = await this.submitVoteTransaction(pollId, optionHash, proof);

    return { hash };
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

    const senderHashKey = Poseidon.hash(sender.toFields());
    map.set(senderHashKey, Bool(true).toField());

    this.voters.forEach((publicKey) => {
      if (publicKey.equals(sender).toBoolean()) {
        return;
      }
      const hashKey = Poseidon.hash(publicKey.toFields());
      map.set(hashKey, Bool(true).toField());
    });

    return map.getWitness(senderHashKey);
  }

  private async mockProof(publicOutput: PollPublicOutput): Promise<PollProof> {
    const dummy = await PollProof.dummy([], [""], 2);
    return new PollProof({
      proof: dummy.proof,
      maxProofsVerified: 2,
      publicInput: undefined,
      publicOutput,
    });
  }

  private async createVoteProof(witness: MerkleMapWitness, pollId: UInt32) {
    const nullifier = await this.wallet.createNullifier([
      Number(pollId.toString()),
    ]);
    const publicOutput = await canVote(witness, nullifier, pollId);
    return await this.mockProof(publicOutput);
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

    const hash = tx.transaction.hash().toString();

    const receipt = await this.wallet.waitForTransactionReceipt(hash);

    if (receipt.status === "FAILURE") {
      throw new Error(receipt.statusMessage as string);
    }

    return hash;
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
