import { BaseController, BaseState } from "./base-controller";
import { pollInsertSchema } from "@/schemas/poll";
import { z } from "zod";
import { Bool, MerkleMap, Poseidon, PublicKey } from "o1js";
import { isPendingTransaction } from "../utils";
import { WalletController } from "./wallet-controller";
import { OptionsHashes } from "chain/dist/runtime/modules/poll";
import { ChainController } from "./chain-controller";
import { PendingTransaction } from "@proto-kit/sequencer";

type CreatePollData = Omit<z.infer<typeof pollInsertSchema>, "id">;

export interface PollManagerState extends BaseState {
  loading: boolean;
  polls: {
    id: number;
    title: string;
    description: string;
    options: string[];
    votersWallets: string[];
  }[];
}

export class PollManagerController extends BaseController<PollManagerState> {
  chain: ChainController;
  wallet: WalletController;

  constructor(
    chain: ChainController,
    wallet: WalletController,
    initialState: Partial<PollManagerState> = {},
  ) {
    super(initialState);
    this.chain = chain;
    this.wallet = wallet;
  }

  public async create(data: CreatePollData): Promise<PendingTransaction> {
    if (!this.wallet.account) {
      throw new Error("Client or wallet not initialized");
    }

    this.update({ loading: true });

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

    return tx.transaction;
  }
}
