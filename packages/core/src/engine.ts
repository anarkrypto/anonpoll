import { client } from '@zeropoll/chain';
import {
	ChainController,
	ChainState,
	PollController,
	PollState,
	PollManagerController,
	PollManagerState,
	WalletController,
	WalletState,
} from '@/controllers';
import { IpfsMetadataStore } from '@/stores/metadata-store';
import { PollData } from '@/schemas';

export interface Controllers {
	wallet: WalletController;
	chain: ChainController;
	poll: PollController;
	pollManager: PollManagerController;
}

export interface EngineConfig {
	tickInterval?: number;
	protokitGraphqlUrl: string;
	ipfsApiUrl: string;
}

export interface EngineState {
	wallet: WalletState;
	chain: ChainState;
	poll: PollState;
	pollManager: PollManagerState;
}

export type EngineContext = Controllers;

/**
 * Core controller responsible for composing other controllers together
 * and exposing convenience methods for common wallet operations.
 */
export class Engine {
	/**
	 * A collection of all controller instances
	 */
	context: EngineContext;

	constructor(config: EngineConfig, initialState: Partial<EngineState> = {}) {
		const chain = new ChainController(
			{
				tickInterval: config.tickInterval || 1000,
				graphqlUrl: config.protokitGraphqlUrl,
			},
			initialState.chain
		);

		const wallet = new WalletController(
			{
				chain,
				client,
			},
			initialState.wallet
		);

		const pollStore = new IpfsMetadataStore<PollData>(config.ipfsApiUrl);

		const pollManager = new PollManagerController(
			{ store: pollStore, client, wallet },
			initialState.pollManager
		);

		const poll = new PollController(
			{ wallet, chain, client, store: pollStore },
			initialState.poll
		);

		this.context = {
			wallet,
			chain,
			poll,
			pollManager,
		};
	}

	async init() {
		await Promise.all([client.start(), this.context.chain.start()]);
	}
}
