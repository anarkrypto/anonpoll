import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";
import { Bool, MerkleMap, Poseidon, PublicKey } from "o1js";
import { isPendingTransaction } from "../utils";
import { WalletController } from "./wallet-controller";
import { OptionsHashes } from "chain/dist/runtime/modules/poll";
import { PollStoreInterface } from "./poll-store";
import { client } from "chain";

type CreatePollData = Omit<z.infer<typeof pollInsertSchema>, "id">;

export interface PollManagerConfig extends BaseConfig {
  client: Pick<typeof client, "query" | "runtime" | "transaction">;
  wallet: WalletController;
  store: PollStoreInterface;
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
  store: PollStoreInterface;

  constructor(
    config: PollManagerConfig,
    state: Partial<PollManagerState> = {},
  ) {
    super(config, state);
    this.client = config.client;
    this.wallet = config.wallet;
    this.store = config.store;
  }

  public async create(data: CreatePollData): Promise<{ id: number }> {
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

    return new Promise(async (resolve, reject) => {
      this.wallet.subscribe(async (_, changedState) => {

        if (changedState.transactions) {
          const transaction = changedState.transactions.find(
            ({ hash }) => hash === tx.transaction?.hash().toString(),
          );

          if (transaction?.status === "SUCCESS") {
            const id = await this.client.query.runtime.Poll.lastPollId.get();

            if (!id) {
              return reject("Could not get poll id");
            }

            const newPollId = Number(id.toBigInt());

            // TODO: In the future, the data should be stored before create the transaction.

            await this.store.persist({
              id: newPollId,
              ...data,
            });

            resolve({ id: newPollId });
          }

          if (transaction?.status === "FAILURE") {
            reject("Transaction failed");
          }
        }
      });
    });
  }
}
