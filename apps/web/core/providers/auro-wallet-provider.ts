import { Nullifier } from "o1js";
import { MinaProviderInterface } from "./base-provider";

type Group = {
  x: bigint;
  y: bigint;
};

type JsonNullifier = {
  publicKey: Group;
  public: {
    nullifier: Group;
    s: bigint;
  };
  private: {
    c: bigint;
    g_r: Group;
    h_m_pk_r: Group;
  };
};

interface AuroWalletProviderInterface extends Omit<MinaProviderInterface, "createNullifier"> {
  createNullifier: ({
    message,
  }: {
    message: number[];
  }) => Promise<JsonNullifier>;
}

export class AuroWalletProvider implements MinaProviderInterface {
  provider: AuroWalletProviderInterface;

  constructor() {
    this.provider = (window as any).mina as AuroWalletProviderInterface;
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
    const jsonNullifier = await this.provider.createNullifier({ message });
    return Nullifier.fromJSON(jsonNullifier);
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
