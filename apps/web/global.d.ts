declare var mina:
  | {
      requestAccounts: () => Promise<string[]>;
      getAccounts: () => Promise<string[]>;
      on: (event: "accountsChanged", handler: (event: any) => void) => void;
      createNullifier: ({ message }: {message: number[]}) => Promise<JsonNullifier>;
      signJsonMessage: ({ message }: {message: { label: string; value: string }[]}) => Promise<{
        data: string;
        publicKey: string;
        signature: { field: string; scalar: string };
      }>
    }
  | undefined;
