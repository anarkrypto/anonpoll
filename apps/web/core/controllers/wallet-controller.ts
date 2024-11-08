import { BaseConfig, BaseController, BaseState } from "./base-controller";
import {
  MinaProviderAbstract,
  MinaProviderError,
} from "../providers/wallets/base-wallet-provider";
import { PendingTransaction } from "@proto-kit/sequencer";
import { ChainController } from "./chain-controller";
import { Field, PublicKey, Signature, UInt64 } from "o1js";
import { MethodIdResolver } from "@proto-kit/module";
import { client } from "chain";

export type TransactionStatus = "PENDING" | "SUCCESS" | "FAILURE";

export interface TransactionJSON {
  hash: string;
  methodId: string;
  methodName: string;
  methodModule: string;
  nonce: string;
  sender: string;
  argsFields: string[];
  auxiliaryData: string[];
  signature: {
    r: string;
    s: string;
  };
  isMessage: boolean;
  status: TransactionStatus;
  statusMessage: string | null;
}

export interface ConfirmedTransaction {
  tx: TransactionJSON;
  status: boolean;
  statusMessage: string | null;
}

export interface WalletConfig extends BaseConfig {
  chain: ChainController;
  client: Pick<typeof client, "resolveOrFail">;
}

export interface WalletState extends BaseState {
  account: string | null;
  loading: boolean;
  transactions: TransactionJSON[];
}

export class WalletController extends BaseController<
  WalletConfig,
  WalletState
> {
  readonly defaultState: WalletState = {
    account: null,
    loading: false,
    transactions: [],
  };

  provider: MinaProviderAbstract | null = null;

  private chain: ChainController;

  private transactions = new Map<string, TransactionJSON>();

  constructor(config: WalletConfig, state: Partial<WalletState> = {}) {
    super(config, state);
    this.chain = config.chain;
    this.initialize();
  }

  public async init(provider: MinaProviderAbstract) {
    this.provider = provider;
    this.update({ loading: true });

    try {
      const account = await this.provider.getAccount();
      this.update({ account });

      this.chain.subscribe((_, changedState) => {
        if (changedState.block) {
          const myRecentConfirmedTransactions = changedState.block.txs
            .filter(({ tx }) => tx.sender === this.account)
            .map(({ tx, status, statusMessage }) => {
              const pendingTransaction = new PendingTransaction({
                methodId: Field(tx.methodId),
                nonce: UInt64.from(tx.nonce),
                isMessage: false,
                sender: PublicKey.fromBase58(tx.sender),
                argsFields: tx.argsFields.map((arg) => Field(arg)),
                auxiliaryData: [],
                signature: Signature.fromJSON({
                  r: tx.signature.r,
                  s: tx.signature.s,
                }),
              });
              return this.buildTransaction(
                pendingTransaction,
                status ? "SUCCESS" : "FAILURE",
                statusMessage,
              );
            });

          if (myRecentConfirmedTransactions.length > 0) {
            myRecentConfirmedTransactions.forEach((tx) => {
              this.transactions.set(tx.hash, tx);
            });
            this.update({
              transactions: Array.from(this.transactions.values()),
            });
          }
        }
      });
    } catch (error) {
      throw MinaProviderError.fromJson(error);
    } finally {
      this.update({ loading: false });
    }
  }

  private ensureProvider(
    provider: MinaProviderAbstract | null,
  ): asserts provider is MinaProviderAbstract {
    if (!provider) {
      throw new Error("Wallet provider is not set");
    }
  }

  public async connect() {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    this.ensureProvider(this.provider);
    this.update({ loading: true });

    try {
      const account = await this.provider.requestAccount();

      this.update({ account });
    } catch (error) {
      throw MinaProviderError.fromJson(error);
    } finally {
      this.update({ loading: false });
    }
  }

  public signJsonMessage(message: { label: string; value: string }[]) {
    this.ensureProvider(this.provider);
    return this.provider.signJsonMessage({ message });
  }

  public async createNullifier(message: number[]) {
    this.ensureProvider(this.provider);
    return await this.provider.createNullifier({ message });
  }

  public addPendingTransaction(transaction: PendingTransaction) {
    if (!this.transactions.has(transaction.hash.toString())) {
      this.transactions.set(
        transaction.hash.toString(),
        this.buildTransaction(transaction, "PENDING"),
      );

      this.update({
        transactions: Array.from(this.transactions.values()),
      });
    }
  }

  private buildTransaction(
    tx: PendingTransaction,
    status: TransactionStatus,
    statusMessage?: string | null,
  ): TransactionJSON {
    const methodIdResolver = this.config.client.resolveOrFail(
      "MethodIdResolver",
      MethodIdResolver,
    );

    const resolvedMethodDetails = methodIdResolver.getMethodNameFromId(
      tx.methodId.toBigInt(),
    );

    if (!resolvedMethodDetails)
      throw new Error("Unable to resolve method details");

    const [moduleName, methodName] = resolvedMethodDetails;

    return {
      hash: tx.hash().toString(),
      methodId: tx.methodId.toString(),
      methodName: methodName,
      methodModule: moduleName,
      nonce: tx.nonce.toString(),
      sender: tx.sender.toBase58(),
      argsFields: tx.argsFields.map((arg) => arg.toString()),
      auxiliaryData: [],
      signature: {
        r: tx.signature.r.toString(),
        s: tx.signature.s.toString(),
      },
      isMessage: false,
      status: status ? "SUCCESS" : "FAILURE",
      statusMessage: statusMessage ?? null,
    };
  }

  get account(): string | null {
    return this.state.account;
  }
}
