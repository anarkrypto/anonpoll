import {
	Bool,
	CircuitString,
	Field,
	MerkleMap,
	MerkleMapWitness,
	Poseidon,
	PublicKey,
} from 'o1js';
import type { client } from '@zeropoll/chain';
import {
	canVote,
	OptionsHashes,
	PollProof,
	PollPublicOutput,
} from '@zeropoll/chain/runtime/modules/poll';
import { BaseConfig, BaseController, BaseState } from './base-controller';
import { ChainController } from './chain-controller';
import { WalletController } from './wallet-controller';
import { AbstractMetadataStore } from '@/stores/metadata-store';
import { MetadataEncryptionV1 } from '@/utils';
import { EncryptedMetadataV1, PollMetadata } from '@/schemas';

export interface PollConfig extends BaseConfig {
	wallet: WalletController;
	chain: ChainController;
	client: Pick<typeof client, 'query' | 'runtime' | 'transaction'>;
	store: AbstractMetadataStore<PollMetadata>;
}

export interface PollOption {
	text: string;
	hash: string;
	votesCount: number;
	votesPercentage: number;
}

export interface PollState extends BaseState {
	loading: boolean;
	id: string | null;
	commitment: string | null;
	metadata: PollMetadata | null;
	options: PollOption[];
}

export interface PollResult {
	commitment: string;
	metadata: PollMetadata;
	options: PollOption[];
}

interface VotingResult {
	hash: string;
	votesCount: number;
}

export class PollController extends BaseController<PollConfig, PollState> {
	private wallet: WalletController;
	private chain: ChainController;
	private client: Pick<typeof client, 'query' | 'runtime' | 'transaction'>;
	private voters = new Map<string, PublicKey>();
	private store: AbstractMetadataStore<PollMetadata | EncryptedMetadataV1>;

	static readonly defaultState: PollState = {
		id: null,
		commitment: null,
		loading: false,
		metadata: null,
		options: [],
	};

	constructor(config: PollConfig, state: Partial<PollState> = {}) {
		super(config, { ...PollController.defaultState, ...state });
		this.wallet = config.wallet;
		this.chain = config.chain;
		this.client = config.client;
		this.store = config.store;
	}

	public async load(id: string, encryptionKey?: string): Promise<PollResult> {
		try {
			if (this.id === id) {
				// Do not load the same poll twice
				return {
					metadata: this.metadata as PollMetadata,
					commitment: this.state.commitment as string,
					options: this.options,
				};
			}

			this.update({
				loading: true,
				commitment: null,
				metadata: null,
				options: [],
			});

			const [metadata, { votingResults, commitment }] = await Promise.all([
				this.getMetadata(id, encryptionKey),
				this.getPoll(id),
			]);

			// Check if the metadata options hashes match the ones on-chain
			this.compareHashes(
				votingResults.map(({ hash }) => hash),
				metadata.options,
				metadata.salt
			);

			// Check if the votersWallets from metadata matches the onchain commitment
			this.compareCommitment(metadata.votersWallets, commitment);

			const options = this.buildOptions(metadata, votingResults);

			let decryptedMetadata = metadata;

			const data = {
				commitment,
				metadata: {
					...decryptedMetadata,
					id,
				},
				options,
			};

			this.update(data);

			metadata.votersWallets.forEach(wallet =>
				this.voters.set(wallet, PublicKey.fromBase58(wallet))
			);

			this.observePoll();

			return data;
		} finally {
			this.update({ loading: false });
		}
	}

	private async getMetadata(
		pollId: string,
		encryptionKey?: string
	): Promise<PollMetadata> {
		if (this.id === pollId) {
			return this.state.metadata as PollMetadata;
		}

		const metadata = await this.store.get(pollId);

		let decryptedMetadata = metadata as PollMetadata;

		if (MetadataEncryptionV1.isEncryptedMetadataV1(metadata)) {
			if (!encryptionKey) {
				throw new Error('No encryption key provided for encrypted poll');
			}
			const metadataEncryptionV1 = new MetadataEncryptionV1(encryptionKey);
			decryptedMetadata = await metadataEncryptionV1.decrypt(metadata);
		}

		if (decryptedMetadata.options.length < 2) {
			throw new Error('Poll must have at least 2 options');
		}

		return decryptedMetadata;
	}

	private async getPoll(pollId: string) {
		const poll = await this.client.query.runtime.Poll.polls.get(
			CircuitString.fromString(pollId)
		);

		if (!poll) {
			throw new Error('Poll not found');
		}

		const votingResults = poll.votes.options.map(option => {
			return {
				hash: option.hash.toString() as string,
				votesCount: Number(option.votesCount.toBigInt()),
			};
		});

		const commitment = Field(poll.commitment).toString();

		return { votingResults, commitment };
	}

	private compareHashes(hashes: string[], optionsText: string[], salt: string) {
		const computedHashes = OptionsHashes.fromStrings(optionsText, salt)
			.hashes as Field[];
		if (
			!computedHashes.every(
				(value, index) => value.toString() === hashes[index]
			)
		) {
			throw new Error('Options hashes do not match');
		}
	}

	private compareCommitment = (publicKeys: string[], commitment: string) => {
		const map = new MerkleMap();
		publicKeys.forEach(publicKey => {
			const hashKey = Poseidon.hash(PublicKey.fromBase58(publicKey).toFields());
			map.set(hashKey, Bool(true).toField());
		});
		if (commitment !== map.getRoot().toString()) {
			throw new Error('Commitment does not match');
		}
	};

	private buildOptions(metadata: PollMetadata, votingResults: VotingResult[]) {
		const totalVotesCast = votingResults.reduce(
			(acc, option) => acc + option.votesCount,
			0
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
			if ('block' in changedState) {
				await this.updateVotingResults();
			}
		});
	}

	private async updateVotingResults() {
		if (!this.id || !this.metadata) {
			throw new Error('Poll not loaded');
		}

		const { votingResults } = await this.getPoll(this.id);

		const options = this.buildOptions(this.metadata, votingResults);

		this.update({
			options,
		});
	}

	public async vote(optionHash: string): Promise<{ hash: string }> {
		this.validateVotePrerequisites();

		const pollId = CircuitString.fromString(this.id!);

		const witness = this.createVotersWitness();
		const proof = await this.createVoteProof(witness, pollId);

		const hash = await this.submitVoteTransaction(pollId, optionHash, proof);

		return { hash };
	}

	private validateVotePrerequisites() {
		if (!this.wallet.account) {
			throw new Error('Wallet not initialized');
		}
		if (!this.state.metadata) {
			throw new Error('Poll not loaded');
		}
		if (!this.voters.has(this.wallet.account)) {
			throw new Error('Wallet is not allowed to vote');
		}
	}

	private createVotersWitness() {
		const map = new MerkleMap();

		const sender = this.wallet.publicKey();
		const senderHashKey = Poseidon.hash(sender.toFields());
		map.set(senderHashKey, Bool(true).toField());

		this.voters.forEach(publicKey => {
			if (publicKey.equals(sender).toBoolean()) {
				return;
			}
			const hashKey = Poseidon.hash(publicKey.toFields());
			map.set(hashKey, Bool(true).toField());
		});

		return map.getWitness(senderHashKey);
	}

	private async mockProof(publicOutput: PollPublicOutput): Promise<PollProof> {
		const dummy = await PollProof.dummy([], [''], 2);
		return new PollProof({
			proof: dummy.proof,
			maxProofsVerified: 2,
			publicInput: undefined,
			publicOutput,
		});
	}

	private async createVoteProof(
		witness: MerkleMapWitness,
		pollId: CircuitString
	) {
		const nullifier = await this.wallet.createNullifier(
			CircuitString.toFields(pollId).map(field => Number(field.toBigInt()))
		);
		const publicOutput = await canVote(witness, nullifier, pollId);
		return await this.mockProof(publicOutput);
	}

	private async submitVoteTransaction(
		pollId: CircuitString,
		optionHash: string,
		proof: any
	) {
		const poll = this.client.runtime.resolve('Poll');
		const tx = await this.client.transaction(
			PublicKey.fromBase58(this.wallet.account!),
			async () => {
				await poll.vote(pollId, Field(optionHash), proof);
			}
		);

		await tx.sign();
		await tx.send();

		WalletController.isPendingTransaction(tx.transaction);
		this.wallet.addPendingTransaction(tx.transaction);

		const hash = tx.transaction.hash().toString();

		const receipt = await this.wallet.waitForTransactionReceipt(hash);

		if (receipt.status === 'FAILURE') {
			throw new Error(receipt.statusMessage as string);
		}

		return hash;
	}

	public get id() {
		return this.state.id;
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
