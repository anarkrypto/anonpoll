import { client } from "chain";
import { ChainController, ChainState } from "./controllers/chain-controller";
import { PollController, PollState } from "./controllers/poll-controller";
import {
  PollManagerController,
  PollManagerState,
} from "./controllers/poll-manager-controller";
import { WalletController, WalletState } from "./controllers/wallet-controller";
import { WalletProvider } from "./providers/wallets/wallet-provider";
import { PollStoreProvider } from "./providers/stores/poll-store-provider";

interface Controllers {
  wallet: WalletController;
  chain: ChainController;
  poll: PollController;
  pollManager: PollManagerController;
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

  constructor(initialState: Partial<EngineState> = {}) {
    const chain = new ChainController(
      {
        tickInterval: 1000,
        graphqlUrl: "",
      },
      initialState.chain,
    );

    const walletProvider = new WalletProvider("");

    const wallet = new WalletController(
      {
        provider: walletProvider,
        chain,
        client: client,
      },
      initialState.wallet,
    );

    const store = new PollStoreProvider("");

    const pollManager = new PollManagerController(
      { store, client, wallet },
      initialState.pollManager,
    );

    const poll = new PollController(
      { wallet, chain, client, store },
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
