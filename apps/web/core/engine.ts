import { client } from "chain";
import { ChainController, ChainState } from "./controllers/chain-controller";
import { PollController, PollState } from "./controllers/poll-controller";
import {
  PollManagerController,
  PollManagerState,
} from "./controllers/poll-manager-controller";
import { WalletController, WalletState } from "./controllers/wallet-controller";
import { PollStoreProvider } from "./providers/stores/poll-store/poll-store-provider";
import { AuthStoreCookieProvider } from "./providers/stores/auth-store/auth-store-cookie-provider";

interface Controllers {
  wallet: WalletController;
  chain: ChainController;
  poll: PollController;
  pollManager: PollManagerController;
}

export interface EngineConfig {
  tickInterval?: number;
  protokitGraphqlUrl: string;
  storeApiUrl: string;
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
      initialState.chain,
    );

    const wallet = new WalletController(
      {
        chain,
        client: client,
      },
      initialState.wallet,
    );

    const authStore = new AuthStoreCookieProvider();
    const pollStore = new PollStoreProvider(config.storeApiUrl, authStore);

    const pollManager = new PollManagerController(
      { store: pollStore, client, wallet },
      initialState.pollManager,
    );

    const poll = new PollController(
      { wallet, chain, client, store: pollStore },
      initialState.poll,
    );

    this.context = {
      wallet,
      chain,
      poll,
      pollManager,
    };
  }
}
