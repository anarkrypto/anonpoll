import { z } from "zod";

export type Group = {
  x: bigint;
  y: bigint;
};

export type Nullifier = {
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

export declare class MinaProvider {
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  on: (event: "accountsChanged", handler: (event: any) => void) => void;
  createNullifier: ({ message }: { message: number[] }) => Promise<Nullifier>;
  signJsonMessage: ({
    message,
  }: {
    message: { label: string; value: string }[];
  }) => Promise<{
    data: string;
    publicKey: string;
    signature: { field: string; scalar: string };
  }>;
};


export class MinaProviderError extends Error {
    code: number;
    data: unknown;
  
    constructor(message: string, code: number, data?: unknown) {
      super(message);
      this.name = "MinaError";
      this.code = code;
      this.data = data;
    }
  
    static fromJson(json: any) {
      const { success, data } = z
        .object({
          message: z.string(),
          code: z.number(),
          data: z.any(),
        })
        .safeParse(json);
      if (success) {
        return new MinaProviderError(data.message, data.code, data.data);
      } else {
        return new MinaProviderError("Unknown error", 0);
      }
    }
  }