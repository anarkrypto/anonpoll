import { BaseController, Store } from "./base-controller";
import { MinaProvider, MinaProviderError } from "../providers/base-provider";

type WalletState = {
  account: string | null;
  loading: boolean;
};

export class WalletController extends BaseController<WalletState> {
  provider: MinaProvider;

  constructor(provider: MinaProvider, store: Store<WalletState>) {
    super(store);
    this.provider = provider;
  }

  public async init() {
    this.store.setState({ loading: true });

    try {
      const [account] = await this.provider.getAccounts();

      this.store.setState({ account });
    } catch (error) {
      throw MinaProviderError.fromJson(error);
    } finally {
      this.store.setState({ loading: false });
    }
  }

  public async connect() {
    this.store.setState({ loading: true });

    try {
      const [account] = await this.provider.requestAccounts();

      this.store.setState({ account });
    } catch (error) {
      throw MinaProviderError.fromJson(error);
    } finally {
      this.store.setState({ loading: false });
    }
  }

  signJsonMessage(message: { label: string; value: string }[]) {
    return this.provider.signJsonMessage({ message });
  }

  get account(): string | null {
    return this.state.account;
  }
}
