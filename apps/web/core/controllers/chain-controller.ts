import { BaseConfig, BaseController, BaseState } from "./base-controller";
import { client } from "chain";

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
  client = client;
  private interval: NodeJS.Timeout | undefined;

  readonly defaultState: ChainState = {
    loading: true,
    online: false,
    block: {
      height: "0",
      txs: [],
    },
  };

  constructor(config: ChainConfig, state: Partial<ChainState> = {}) {
    super(config, state);
  }

  async loadBlock() {
    this.update({ loading: true });

    try {
      const response = await fetch(this.config.graphqlUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: `
                query {
                network {
                    unproven {
                    block {
                        height
                    }
                    }
                }
                block {
                    txs {
                    status
                    statusMessage
                    tx {
                        argsFields
                        argsJSON
                        methodId
                        nonce
                        sender
                        signature {
                        r
                        s
                        }
                    }
                    }
                }
                }
            `,
        }),
      });

      const { data }: BlockQueryResponse = await response.json();

      if (data.network.unproven) {
        this.update({
          block: {
            height: data.network.unproven.block.height,
            txs: data.block.txs || [],
          },
        });
      }
    } catch (error) {
      throw error;
    } finally {
      this.update({ loading: false });
    }
  }

  async start() {
    await this.client.start();
    await this.loadBlock();
    this.interval = setInterval(() => this.loadBlock(), this.config.tickInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
