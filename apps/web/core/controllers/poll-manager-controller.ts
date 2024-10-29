import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";
import { Bool, MerkleMap, Poseidon, PublicKey } from "o1js";
import { isPendingTransaction } from "../utils";
import { WalletController } from "./wallet-controller";
import { OptionsHashes } from "chain/dist/runtime/modules/poll";
import { ChainController } from "./chain-controller";
import { PollStoreController } from "./poll-store";

type CreatePollData = Omit<z.infer<typeof pollInsertSchema>, "id">;

export interface PollManagerConfig extends BaseConfig {
  chain: ChainController;
  wallet: WalletController;
  baseApiUrl: string;
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
  chain: ChainController;
  wallet: WalletController;
  store: PollStoreController;

  constructor(
    config: PollManagerConfig,
    state: Partial<PollManagerState> = {},
  ) {
    super(config, state);
    this.chain = config.chain;
    this.wallet = config.wallet;
    this.store = new PollStoreController({
      baseApiUrl: config.baseApiUrl,
    });
  }

  public async create(data: CreatePollData): Promise<{ id: number }> {
    if (!this.wallet.account) {
      throw new Error("Client or wallet not initialized");
    }

    const poll = this.chain.client.runtime.resolve("Poll");
    const sender = PublicKey.fromBase58(this.wallet.account);
    const map = new MerkleMap();

    data.votersWallets.forEach((address) => {
      const publicKey = PublicKey.fromBase58(address);
      const hashKey = Poseidon.hash(publicKey.toFields());
      map.set(hashKey, Bool(true).toField());
    });

    const optionsHashes = OptionsHashes.fromTexts(data.options, data.salt);

    const tx = await this.chain.client.transaction(sender, async () => {
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
            const id =
              await this.chain.client.query.runtime.Poll.lastPollId.get();

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
