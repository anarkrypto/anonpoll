import type { client } from '@zeropoll/chain';
import { Field, PublicKey, Signature, UInt64 } from 'o1js';
import { MethodIdResolver } from '@proto-kit/module';
import { PendingTransaction, UnsignedTransaction } from '@proto-kit/sequencer';
import { MinaSignerAbstract, MinaSignerError } from '@/signers';
import { BaseConfig, BaseController, BaseState } from './base-controller';
import { ChainController } from './chain-controller';

export type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILURE';

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

export interface TransactionReceipt extends TransactionJSON {
	status: 'SUCCESS' | 'FAILURE';
}

export interface ConfirmedTransaction {
	tx: TransactionJSON;
	status: boolean;
	statusMessage: string | null;
}

export interface WalletConfig extends BaseConfig {
	chain: ChainController;
	client: Pick<typeof client, 'resolveOrFail'>;
}

export interface WalletState extends BaseState {
	initialized: boolean;
	account: string | null;
	connected: boolean;
	loading: boolean;
	transactions: TransactionJSON[];
}

export class WalletController extends BaseController<
	WalletConfig,
	WalletState
> {
	static readonly defaultState: WalletState = {
		initialized: false,
		account: null,
		connected: false,
		loading: false,
		transactions: [],
	};

	provider: MinaSignerAbstract | null = null;

	private chain: ChainController;

	private transactions = new Map<string, TransactionJSON>();

	constructor(config: WalletConfig, state: Partial<WalletState> = {}) {
		super(config, {
			...WalletController.defaultState,
			...state,
		});
		this.chain = config.chain;
	}

	public async init(provider: MinaSignerAbstract) {
		this.provider = provider;
		this.update({ loading: true });

		try {
			const account = await this.provider.getAccount();
			this.update({ account, initialized: true, connected: !!account });
			this.observeTransactions();
		} catch (error) {
			throw MinaSignerError.fromJson(error);
		} finally {
			this.update({ loading: false });
		}
	}

	private ensureProviderExists(
		provider: MinaSignerAbstract | null
	): asserts provider is MinaSignerAbstract {
		if (!provider) {
			throw new Error('Wallet provider is not set');
		}
	}

	private observeTransactions() {
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
							argsFields: tx.argsFields.map(arg => Field(arg)),
							auxiliaryData: [],
							signature: Signature.fromJSON({
								r: tx.signature.r,
								s: tx.signature.s,
							}),
						});
						return this.buildTransaction(
							pendingTransaction,
							status ? 'SUCCESS' : 'FAILURE',
							statusMessage
						);
					});

				if (myRecentConfirmedTransactions.length > 0) {
					myRecentConfirmedTransactions.forEach(tx => {
						this.transactions.set(tx.hash, tx);
					});
					this.update({
						transactions: Array.from(this.transactions.values()),
					});
				}
			}
		});
	}

	public async connect() {
		await new Promise(resolve => setTimeout(resolve, 1000));
		this.ensureProviderExists(this.provider);
		this.update({ loading: true });

		try {
			const account = await this.provider.requestAccount();
			this.update({ account, connected: true });
		} catch (error) {
			throw MinaSignerError.fromJson(error);
		} finally {
			this.update({ loading: false });
		}
	}

	public signJsonMessage(message: { label: string; value: string }[]) {
		this.ensureProviderExists(this.provider);
		return this.provider.signJsonMessage({ message });
	}

	public async createNullifier(message: number[]) {
		this.ensureProviderExists(this.provider);
		return await this.provider.createNullifier({ message });
	}

	public addPendingTransaction(transaction: PendingTransaction) {
		const hash = transaction.hash().toString();
		if (!this.transactions.has(hash)) {
			this.transactions.set(
				hash,
				this.buildTransaction(transaction, 'PENDING')
			);

			this.update({
				transactions: Array.from(this.transactions.values()),
			});
		}
	}

	private buildTransaction(
		tx: PendingTransaction,
		status: TransactionStatus,
		statusMessage?: string | null
	): TransactionJSON {
		const methodIdResolver = this.config.client.resolveOrFail(
			'MethodIdResolver',
			MethodIdResolver
		);

		const resolvedMethodDetails = methodIdResolver.getMethodNameFromId(
			tx.methodId.toBigInt()
		);

		if (!resolvedMethodDetails)
			throw new Error('Unable to resolve method details');

		const [moduleName, methodName] = resolvedMethodDetails;

		return {
			hash: tx.hash().toString(),
			methodId: tx.methodId.toString(),
			methodName: methodName,
			methodModule: moduleName,
			nonce: tx.nonce.toString(),
			sender: tx.sender.toBase58(),
			argsFields: tx.argsFields.map(arg => arg.toString()),
			auxiliaryData: [],
			signature: {
				r: tx.signature.r.toString(),
				s: tx.signature.s.toString(),
			},
			isMessage: false,
			status,
			statusMessage: statusMessage ?? null,
		};
	}

	get account(): string | null {
		return this.state.account;
	}

	async waitForTransactionReceipt(hash: string): Promise<TransactionReceipt> {
		const transaction = this.transactions.get(hash);
		if (!transaction) {
			throw new Error('Transaction not found');
		}
		if (transaction.status === 'SUCCESS' || transaction.status === 'FAILURE') {
			return transaction as TransactionReceipt;
		}
		return new Promise(resolve => {
			const unsubscribe = this.subscribe((_, partialState) => {
				if (partialState.transactions) {
					const tx = partialState.transactions.find(tx => tx.hash === hash);
					if (tx?.status === 'SUCCESS' || tx?.status === 'FAILURE') {
						resolve(tx as TransactionReceipt);
						unsubscribe();
					}
				}
			});
		});
	}

	publicKey() {
		return PublicKey.fromBase58(this.account!);
	}

	static isPendingTransaction(
		transaction: PendingTransaction | UnsignedTransaction | undefined
	): asserts transaction is PendingTransaction {
		if (!(transaction instanceof PendingTransaction))
			throw new Error('Transaction is not a PendingTransaction');
	}
}
