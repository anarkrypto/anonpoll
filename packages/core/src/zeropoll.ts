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
	BaseState,
	BaseController,
	BaseConfig,
} from '@/controllers';
import { IpfsMetadataStore } from '@/stores/metadata-store';
import { PollData } from '@/schemas';

export interface ZeroPollConfig extends BaseConfig {
	tickInterval?: number;
	protokitGraphqlUrl: string;
	ipfsApiUrl: string;
}

export interface ZeroPollState extends BaseState {
	initialized: boolean;
	wallet: WalletState;
	chain: ChainState;
	poll: PollState;
	pollManager: PollManagerState;
}

/**
 * ZeroPoll core controller engine
 */
export class ZeroPoll extends BaseController<ZeroPollConfig, ZeroPollState> {
	chain: ChainController;
	wallet: WalletController;
	poll: PollController;
	pollManager: PollManagerController;

	constructor(
		config: ZeroPollConfig,
		initialState: Partial<ZeroPollState> = {}
	) {
		super(config, initialState);

		this.chain = new ChainController(
			{
				tickInterval: config.tickInterval ?? 1000,
				graphqlUrl: config.protokitGraphqlUrl,
			},
			initialState.chain
		);

		this.wallet = new WalletController(
			{
				chain: this.chain,
				client,
			},
			initialState.wallet
		);

		const pollStore = new IpfsMetadataStore<PollData>(config.ipfsApiUrl);

		this.pollManager = new PollManagerController(
			{ store: pollStore, client, wallet: this.wallet },
			initialState.pollManager
		);

		this.poll = new PollController(
			{ wallet: this.wallet, chain: this.chain, client, store: pollStore },
			initialState.poll
		);

		const controllers = {
			wallet: this.wallet,
			chain: this.chain,
			poll: this.poll,
			pollManager: this.pollManager,
		};

		Object.entries(controllers).forEach(([key, controller]) => {
			controller.subscribe(childState => {
				this.update({
					[key]: childState,
				});
			});
		});
	}

	async init() {
		await Promise.all([client.start(), this.chain.start()]);
	}
}
