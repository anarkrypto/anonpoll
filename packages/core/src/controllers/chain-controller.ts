import { BaseConfig, BaseController, BaseState } from './base-controller';

export interface ComputedTransactionJSON {
	argsFields: string[];
	argsJSON: string[];
	methodId: string;
	nonce: string;
	sender: string;
	signature: {
		r: string;
		s: string;
	};
}

export interface ComputedBlockJSON {
	txs: {
		status: boolean;
		statusMessage?: string;
		tx: ComputedTransactionJSON;
	}[];
}

export interface BlockQueryResponse {
	data: {
		network: {
			unproven?: {
				block: {
					height: string;
				};
			};
		};
		block: ComputedBlockJSON;
	};
}

export interface ChainConfig extends BaseConfig {
	tickInterval: number;
	graphqlUrl: string;
}

export interface ChainState extends BaseState {
	loading: boolean;
	online: boolean;
	block: {
		height: string;
	} & ComputedBlockJSON;
}

export class ChainController extends BaseController<ChainConfig, ChainState> {
	private interval: NodeJS.Timeout | undefined;

	static readonly defaultState: ChainState = {
		loading: true,
		online: false,
		block: {
			height: '0',
			txs: [],
		},
	};

	constructor(config: ChainConfig, state: Partial<ChainState> = {}) {
		if (config.tickInterval < 1000) {
			throw new Error('Tick interval must be at least 1000ms');
		}
		super(config, { ...ChainController.defaultState, ...state });
	}

	async loadBlock() {
		try {
			const response = await fetch(this.config.graphqlUrl, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					query: `
          query GetBlock {
            block {
              txs {
                tx {
                  argsFields
                  auxiliaryData
                  methodId
                  nonce
                  sender
                  signature {
                    r
                    s
                  }
                }
                status
                statusMessage
              }
            }
            network {
              unproven {
                block {
                  height
                }
              }
            }
          }
        `,
				}),
			});

			const { data } = (await response.json()) as BlockQueryResponse;

			if (data.network.unproven) {
				this.update({
					block: {
						height: data.network.unproven.block.height,
						txs: data.block.txs || [],
					},
					online: true,
				});
			}
		} catch (error) {
			this.update({ online: false });
			throw error;
		}
	}

	async start() {
		this.update({ loading: true });
		try {
			await this.loadBlock();
			this.interval = setInterval(
				() => this.loadBlock(),
				this.config.tickInterval
			);
		} finally {
			this.update({ loading: false });
		}
	}

	stop() {
		if (this.interval) {
			clearInterval(this.interval);
		}
	}
}
