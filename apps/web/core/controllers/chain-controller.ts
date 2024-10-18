import { BaseController, BaseState } from "./base-controller";
import { client } from "chain";

export const tickInterval = 1000;

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
  txs?: {
    status: boolean;
    statusMessage?: string;
    tx: ComputedTransactionJSON;
  }[];
}

export interface ChainState extends BaseState {
  loading: boolean;
  online: boolean;
  block?: {
    height: string;
  } & ComputedBlockJSON;
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

export class ChainController extends BaseController<ChainState> {

  client = client
  private interval: NodeJS.Timeout | undefined;

  readonly defaultState: ChainState = {
    loading: true,
    online: false,
  };

  constructor(initialState: Partial<ChainState> = {}) {
    super(initialState);
  }

  async loadBlock() {
    this.update({ loading: true });

    try {
      const graphql = process.env.NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL;
      if (graphql === undefined) {
        throw new Error(
          "Environment variable NEXT_PUBLIC_PROTOKIT_GRAPHQL_URL not set, can't execute graphql requests",
        );
      }

      const response = await fetch(graphql, {
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

      const block = data.network.unproven
        ? {
            height: data.network.unproven.block.height,
            ...data.block,
          }
        : undefined;

      this.update({
        block,
        loading: false,
      });
    } catch (error) {
      throw error;
    } finally {
      this.update({ loading: false });
    }
  }

  async start() {
    await this.client.start();
    await this.loadBlock();
    this.interval = setInterval(() => this.loadBlock(), tickInterval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }
}
