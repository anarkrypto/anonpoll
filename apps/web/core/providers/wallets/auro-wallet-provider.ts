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

interface AuroWalletProviderInterface {
  // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_requestaccounts
  requestAccounts: () => Promise<string[]>;

  // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_accounts
  getAccounts: () => Promise<string[]>;

  // https://docs.aurowallet.com/general/reference/api-reference/events#accountschanged
  on: (event: "accountsChanged", handler: (event: any) => void) => void;

  // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_createnullifier
  createNullifier: ({
    message,
  }: {
    message: number[];
  }) => Promise<JsonNullifier>;

  // https://docs.aurowallet.com/general/reference/api-reference/methods/mina_sign_jsonmessage
  signJsonMessage: ({
    message,
  }: {
    message: { label: string; value: string }[];
  }) => Promise<{
    data: string;
    publicKey: string;
    signature: { field: string; scalar: string };
  }>;
}

export class AuroWalletProvider implements MinaProviderInterface {
  provider: AuroWalletProviderInterface;

  constructor() {
    this.provider = (window as any).mina as AuroWalletProviderInterface;
  }

  static isInstalled() {
    return typeof (window as any).mina !== "undefined";
  }

  async requestAccount() {
    const accounts = await this.provider.requestAccounts();
    if (!accounts.length) {
      throw new Error("No accounts found");
    }
    return accounts[0];
  }

  async getAccount() {
    const accounts = await this.provider.getAccounts();
    return accounts[0];
  }

  async on(event: "accountsChanged", handler: (event: any) => void) {
    return this.provider.on(event, handler);
  }

  async createNullifier({ message }: { message: number[] }) {
    const jsonNullifier = await this.provider.createNullifier({ message });
    return Nullifier.fromJSON(jsonNullifier);
  }

  async signJsonMessage({
    message,
  }: {
    message: { label: string; value: string }[];
  }) {
    return this.provider.signJsonMessage({ message });
  }
}
