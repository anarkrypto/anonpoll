import { MinaProvider } from "./base-provider";

export class AuroWalletProvider implements MinaProvider {
  provider: MinaProvider;

  constructor() {
    this.provider = (window as any).mina as MinaProvider;
  }

  static isInstalled() {
    return typeof (window as any).mina !== "undefined";
  }

  async requestAccounts() {
    // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_requestaccounts
    return this.provider.requestAccounts();
  }

  async getAccounts() {
    // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_accounts
    return this.provider.getAccounts();
  }

  async on(event: "accountsChanged", handler: (event: any) => void) {
    // https://docs.aurowallet.com/general/reference/api-reference/events#accountschanged
    return this.provider.on(event, handler);
  }

  async createNullifier({ message }: { message: number[] }) {
    // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_createnullifier
    return this.provider.createNullifier({ message });
  }

  async signJsonMessage({
    message,
  }: {
    message: { label: string; value: string }[];
  }) {
    // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_sign_jsonmessage
    return this.provider.signJsonMessage({ message });
  }
}
