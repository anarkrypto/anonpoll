import { Bool, Field, MerkleMap, Poseidon, PublicKey } from "o1js";
import { UInt32 } from "@proto-kit/library";
import { ModuleQuery } from "@proto-kit/sequencer";
import { client } from "chain";
import { canVote, OptionsHashes, Poll } from "chain/dist/runtime/modules/poll";
import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { ChainController } from "./chain-controller";
import { mockProof } from "@/lib/utils";
import { WalletController } from "./wallet-controller";
import { isPendingTransaction } from "../utils";
import { PollStoreInterface } from "../providers/stores/poll-store-interface";
import { PollData } from "@/types/poll";

export interface PollConfig extends BaseConfig {
  wallet: WalletController;
  chain: ChainController;
  client: Pick<typeof client, "query" | "runtime" | "transaction">;
  store: PollStoreInterface;
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
  private pollQuery: ModuleQuery<Poll>;
  private poll: Poll;
  private voters = new Set<string>();
  private store: PollStoreInterface;

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
    this.pollQuery = this.client.query.runtime.Poll;
    this.poll = this.client.runtime.resolve("Poll");
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
    const votesOptions = (await this.pollQuery.votes.get(pollId))?.options.map(
      (option) => {
        return {
          hash: option.hash.toString(),
          votesCount: Number(option.votesCount.toBigInt()),
        };
      },
    );

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

  public async vote(id: number, optionHash: string) {
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
    const nullifier = await this.wallet.createNullifier([
      Number(pollId.toString()),
    ]);

    const publicOutput = await canVote(witness, nullifier, pollId);

    const pollProof = await mockProof(publicOutput);

    const tx = await this.client.transaction(sender, async () => {
      await this.poll.vote(pollId, Field(optionHash), pollProof);
    });

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
