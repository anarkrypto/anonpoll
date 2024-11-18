import { client } from "chain";
import { ChainController, ChainState } from "./controllers/chain-controller";
import { PollController, PollState } from "./controllers/poll-controller";
import {
  PollManagerController,
  PollManagerState,
} from "./controllers/poll-manager-controller";
import { WalletController, WalletState } from "./controllers/wallet-controller";
import { PollStoreProvider } from "./stores/poll-store/poll-store-provider";
import { AuthStoreCookie } from "./stores/auth-store/auth-store-cookie";
import { AuthController, AuthState } from "./controllers/auth-controller";

interface Controllers {
  wallet: WalletController;
  chain: ChainController;
  poll: PollController;
  pollManager: PollManagerController;
  auth: AuthController;
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
  auth: AuthState;
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
        client,
      },
      initialState.wallet,
    );

    const authStore = new AuthStoreCookie();
    const pollStore = new PollStoreProvider(config.storeApiUrl, authStore);

    const auth = new AuthController(
      {
        wallet,
        store: authStore,
      },
      initialState.wallet,
    );

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
      auth,
    };
  }

  async init() {
    await Promise.all([
      client.start(),
      this.context.chain.start(),
      this.context.auth.init(),
    ]);
  }
}
