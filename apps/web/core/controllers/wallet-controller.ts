import { BaseController, BaseState } from "./base-controller";
import { MinaProvider, MinaProviderError } from "../providers/base-provider";
import { PendingTransaction } from "@proto-kit/sequencer";
import { ChainController } from "./chain-controller";
import { Field, PublicKey, Signature, UInt64 } from "o1js";

export interface TransactionJSON {
  hash: string;
  methodId: string;
  nonce: string;
  sender: string;
  argsFields: string[];
  auxiliaryData: string[];
  signature: {
    r: string;
    s: string;
  };
  isMessage: boolean;
  status: "PENDING" | "SUCCESS" | "FAILURE";
  statusMessage: string | null;
}

export interface ConfirmedTransaction {
  tx: TransactionJSON;
  status: boolean;
  statusMessage: string | null;
}

interface WalletState extends BaseState {
  account: string | null;
  loading: boolean;
  transactions: TransactionJSON[];
}

export class WalletController extends BaseController<WalletState> {
  readonly defaultState: WalletState = {
    account: null,
    loading: false,
    transactions: [],
  };

  provider: MinaProvider;

  private chain: ChainController;

  private transactions = new Map<string, TransactionJSON>();

  constructor(
    provider: MinaProvider,
    chain: ChainController,
    initialState: Partial<WalletState> = {},
  ) {
    super(initialState);
    this.provider = provider;
    this.chain = chain;
  }

  public async init() {
    this.update({ loading: true });

    try {
      const [account] = await this.provider.getAccounts();
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
              return {
                ...pendingTransaction.toJSON(),
                status: status ? "SUCCESS" : "FAILURE",
                statusMessage: statusMessage ?? null,
              } as TransactionJSON;
            });

          if (myRecentConfirmedTransactions.length > 0) {
            myRecentConfirmedTransactions.forEach((tx) => {
              if (this.transactions.has(tx.hash)) {
                this.transactions.set(tx.hash, tx);
              } else {
                this.transactions.set(tx.hash, tx);
              }
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

  public async connect() {
    this.update({ loading: true });

    try {
      const [account] = await this.provider.requestAccounts();

      this.update({ account });
    } catch (error) {
      throw MinaProviderError.fromJson(error);
    } finally {
      this.update({ loading: false });
    }
  }

  public signJsonMessage(message: { label: string; value: string }[]) {
    return this.provider.signJsonMessage({ message });
  }

  public async createNullifier(message: number[]) {
    return await this.provider.createNullifier({ message });
  }

  public addPendingTransaction(transaction: PendingTransaction) {
    if (!this.transactions.has(transaction.hash.toString())) {
      this.update({
        transactions: [
          ...this.state.transactions,
          {
            ...transaction.toJSON(),
            status: "PENDING",
            statusMessage: null,
          },
        ],
      });
    }
  }

  get account(): string | null {
    return this.state.account;
  }
}
