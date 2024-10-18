import { BaseController } from "./base-controller";
import { MinaProvider, MinaProviderError } from "../providers/base-provider";

type WalletState = {
  account: string | null;
  loading: boolean;
};

export class WalletController extends BaseController<WalletState> {
  readonly defaultState: WalletState = {
    account: null,
    loading: false,
  };

  provider: MinaProvider;

  constructor(provider: MinaProvider, initialState: Partial<WalletState> = {}) {
    super(initialState);
    this.provider = provider;
  }

  public async init() {
    this.update({ loading: true });

    try {
      const [account] = await this.provider.getAccounts();

      this.update({ account });
    } catch (error) {
      throw MinaProviderError.fromJson(error);
    } finally {
      this.update({ loading: false });
    }
  }

  public async connect() {
    this.update({ loading: true });

    try {
      const [account] = await this.provider.requestAccounts();

      this.update({ account });
    } catch (error) {
      throw MinaProviderError.fromJson(error);
    } finally {
      this.update({ loading: false });
    }
  }

  public signJsonMessage(message: { label: string; value: string }[]) {
    return this.provider.signJsonMessage({ message });
  }

  public async createNullifier(message: number[]) {
    return await this.provider.createNullifier({ message });
  }

  get account(): string | null {
    return this.state.account;
  }
}
