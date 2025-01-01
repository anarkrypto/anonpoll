import { BaseConfig, BaseController, BaseState } from './base-controller';
import {
	EncryptedMetadataV1,
	PollMetadata,
	pollMetadataSchema,
} from '@/schemas';
import { z } from 'zod';
import { Bool, CircuitString, MerkleMap, Poseidon, PublicKey } from 'o1js';
import { WalletController } from './wallet-controller';
import { OptionsHashes } from '@zeropoll/chain/runtime/modules/poll';
import { AbstractMetadataStore } from '@/stores/metadata-store';
import type { client } from '@zeropoll/chain';
import { MetadataEncryptionV1 } from '@/utils';

export interface PollManagerConfig extends BaseConfig {
	client: Pick<typeof client, 'query' | 'runtime' | 'transaction'>;
	wallet: WalletController;
	store: AbstractMetadataStore;
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
	client: Pick<typeof client, 'query' | 'runtime' | 'transaction'>;
	wallet: WalletController;
	store: AbstractMetadataStore;

	static readonly defaultState: PollManagerState = {
		polls: [],
	};

	constructor(
		config: PollManagerConfig,
		state: Partial<PollManagerState> = {}
	) {
		super(config, {
			...PollManagerController.defaultState,
			...state,
		});
		this.client = config.client;
		this.wallet = config.wallet;
		this.store = config.store;
	}

	public async create(
		data: PollMetadata,
		encryptionKey?: string
	): Promise<{ id: string; hash: string }> {
		if (!this.wallet.account) {
			throw new Error('Client or wallet not initialized');
		}

		const poll = this.client.runtime.resolve('Poll');
		const sender = PublicKey.fromBase58(this.wallet.account);
		const map = new MerkleMap();

		data.votersWallets?.forEach(address => {
			const publicKey = PublicKey.fromBase58(address);
			const hashKey = Poseidon.hash(publicKey.toFields());
			map.set(hashKey, Bool(true).toField());
		});

		const optionsHashes = OptionsHashes.fromStrings(data.options, data.salt);

		const storeData = encryptionKey
			? await this.encrypt(data, encryptionKey)
			: data;

		const { key: id } = await this.store.put(storeData);

		const tx = await this.client.transaction(sender, async () => {
			await poll.createPoll(
				CircuitString.fromString(id),
				map.getRoot(),
				optionsHashes
			);
		});

		await tx.sign();
		await tx.send();

		WalletController.isPendingTransaction(tx.transaction);
		this.wallet.addPendingTransaction(tx.transaction);

		const hash = tx.transaction.hash().toString();

		const receipt = await this.wallet.waitForTransactionReceipt(hash);

		if (receipt.status === 'FAILURE') {
			throw new Error(receipt.statusMessage as string);
		}

		return {
			id,
			hash,
		};
	}

	private async encrypt(
		data: PollMetadata,
		key: string
	): Promise<EncryptedMetadataV1> {
		const metadataEncryptionV1 = new MetadataEncryptionV1(key);
		return await metadataEncryptionV1.encrypt(JSON.stringify(data));
	}
}
