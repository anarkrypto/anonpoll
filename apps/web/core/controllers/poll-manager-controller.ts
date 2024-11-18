import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";
import { Bool, MerkleMap, Poseidon, PublicKey } from "o1js";
import { isPendingTransaction } from "../utils";
import { WalletController } from "./wallet-controller";
import { OptionsHashes } from "chain/dist/runtime/modules/poll";
import { AbstractPollStore } from "../stores/poll-store";
import type { client } from "chain";

export type CreatePollData = Omit<z.infer<typeof pollInsertSchema>, "id">;

export interface PollManagerConfig extends BaseConfig {
  client: Pick<typeof client, "query" | "runtime" | "transaction">;
  wallet: WalletController;
  store: AbstractPollStore;
}

export interface PollManagerState extends BaseState {
  polls: {
    id: number;
    title: string;
    description: string;
    options: string[];
    votersWallets: string[];
  }[];
}

export class PollManagerController extends BaseController<
  PollManagerConfig,
  PollManagerState
> {
  client: Pick<typeof client, "query" | "runtime" | "transaction">;
  wallet: WalletController;
  store: AbstractPollStore;

  constructor(
    config: PollManagerConfig,
    state: Partial<PollManagerState> = {},
  ) {
    super(config, state);
    this.client = config.client;
    this.wallet = config.wallet;
    this.store = config.store;
    this.initialize();
  }

  public async create(
    data: CreatePollData,
  ): Promise<{ id: number; hash: string }> {
    if (!this.wallet.account) {
      throw new Error("Client or wallet not initialized");
    }

    const poll = this.client.runtime.resolve("Poll");
    const sender = PublicKey.fromBase58(this.wallet.account);
    const map = new MerkleMap();

    data.votersWallets.forEach((address) => {
      const publicKey = PublicKey.fromBase58(address);
      const hashKey = Poseidon.hash(publicKey.toFields());
      map.set(hashKey, Bool(true).toField());
    });

    const optionsHashes = OptionsHashes.fromTexts(data.options, data.salt);

    const tx = await this.client.transaction(sender, async () => {
      await poll.createPoll(map.getRoot(), optionsHashes);
    });

    await tx.sign();
    await tx.send();

    isPendingTransaction(tx.transaction);
    this.wallet.addPendingTransaction(tx.transaction);

    const hash = tx.transaction.hash().toString();

    const receipt = await this.wallet.waitForTransactionReceipt(hash);

    if (receipt.status === "FAILURE") {
      throw new Error(receipt.statusMessage as string);
    }

    // TODO: refactor this
    // Issue: this is not guaranteed to be the last poll id
    const id = await this.getLastPollId();

    // TODO: The data should be stored before create the transaction.
    await this.store.persist({
      id,
      ...data,
    });

    return {
      id,
      hash,
    };
  }

  private async getLastPollId(): Promise<number> {
    const id = await this.client.query.runtime.Poll.lastPollId.get();
    if (!id) {
      throw new Error("Could not get poll id");
    }
    return Number(id.toBigInt());
  }
}
